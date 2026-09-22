// Generates a lightweight 1080x1080 flyer when an event has no uploaded artwork.

export interface FallbackFlyerData {
  title: string;
  date?: string | null;
  startTime?: string | null;
  location?: string | null;
  category?: string | null;
}

type FlyerLayout = "editorial" | "poster" | "split" | "orbit";

export interface FallbackFlyerStyle {
  layout: FlyerLayout;
  palette: {
    background: string;
    backgroundDark: string;
    accent: string;
    text: string;
    muted: string;
  };
}

const PALETTES = [
  { background: "#1f4d3a", backgroundDark: "#0e2a1f", accent: "#f5b400", text: "#fafaf5", muted: "rgba(250,250,245,0.78)" },
  { background: "#b7312c", backgroundDark: "#4f171d", accent: "#ffd166", text: "#fffaf2", muted: "rgba(255,250,242,0.78)" },
  { background: "#176b87", backgroundDark: "#12334c", accent: "#ffcf56", text: "#f7fcff", muted: "rgba(247,252,255,0.78)" },
  { background: "#643c77", backgroundDark: "#2b1d42", accent: "#7ee081", text: "#fffaff", muted: "rgba(255,250,255,0.78)" },
  { background: "#bb5a2a", backgroundDark: "#4a261d", accent: "#99e1d9", text: "#fffaf4", muted: "rgba(255,250,244,0.78)" },
] as const;

const LAYOUTS: FlyerLayout[] = ["editorial", "poster", "split", "orbit"];
const LOGO_URL = "/coeaboa-logo.jpg";
let cachedLogo: HTMLImageElement | null = null;

export function pickFallbackFlyerStyle(random: () => number = Math.random): FallbackFlyerStyle {
  const paletteIndex = Math.min(PALETTES.length - 1, Math.floor(Math.max(0, random()) * PALETTES.length));
  const layoutIndex = Math.min(LAYOUTS.length - 1, Math.floor(Math.max(0, random()) * LAYOUTS.length));
  return { palette: { ...PALETTES[paletteIndex] }, layout: LAYOUTS[layoutIndex] };
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (cachedLogo) return cachedLogo;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      cachedLogo = img;
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = test;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && ctx.measureText(`${lines[maxLines - 1]}…`).width > maxWidth) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, -3)}…`;
  }
  return lines.length ? lines : ["Evento"];
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawBackground(ctx: CanvasRenderingContext2D, style: FallbackFlyerStyle, size: number) {
  const { palette, layout } = style;
  const gradient = ctx.createLinearGradient(0, 0, layout === "split" ? 0 : size, size);
  gradient.addColorStop(0, palette.background);
  gradient.addColorStop(1, palette.backgroundDark);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = palette.accent;
  if (layout === "editorial") {
    ctx.translate(900, -60);
    ctx.rotate(Math.PI / 7);
    for (let x = 0; x < 420; x += 48) ctx.fillRect(x, 0, 12, 1160);
  } else if (layout === "poster") {
    for (let radius = 80; radius <= 520; radius += 90) {
      ctx.lineWidth = 18;
      ctx.strokeStyle = palette.accent;
      ctx.beginPath();
      ctx.arc(880, 190, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (layout === "split") {
    ctx.beginPath();
    ctx.moveTo(620, 0);
    ctx.lineTo(size, 0);
    ctx.lineTo(size, 650);
    ctx.lineTo(430, size);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.lineWidth = 22;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.ellipse(540, 480, 260 + i * 78, 110 + i * 54, -0.4, 0, Math.PI * 2);
      ctx.strokeStyle = palette.accent;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawBrand(ctx: CanvasRenderingContext2D, logo: HTMLImageElement | null, style: FallbackFlyerStyle) {
  const compact = style.layout === "poster";
  const logoSize = compact ? 88 : 104;
  const y = compact ? 58 : 68;
  if (logo) {
    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.drawImage(logo, 70, y, logoSize, logoSize);
    ctx.restore();
  }
  ctx.fillStyle = style.palette.text;
  ctx.font = "700 30px 'Helvetica Neue', Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("Coé a Boa?", logo ? 194 : 70, y + logoSize / 2);
}

function drawCategory(ctx: CanvasRenderingContext2D, category: string | null | undefined, style: FallbackFlyerStyle) {
  if (!category?.trim()) return;
  const label = category.trim().toUpperCase();
  ctx.font = "700 23px 'Helvetica Neue', Arial, sans-serif";
  const width = Math.min(480, ctx.measureText(label).width + 50);
  const x = style.layout === "poster" ? 540 - width / 2 : 70;
  const y = style.layout === "poster" ? 205 : 218;
  roundedRect(ctx, x, y, width, 56, 12);
  ctx.fillStyle = style.palette.accent;
  ctx.fill();
  ctx.fillStyle = style.palette.backgroundDark;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + width / 2, y + 29, width - 30);
  ctx.textAlign = "left";
}

function drawTitle(ctx: CanvasRenderingContext2D, title: string, style: FallbackFlyerStyle) {
  const centered = style.layout === "poster" || style.layout === "orbit";
  const fontSize = style.layout === "split" ? 82 : 88;
  const maxWidth = style.layout === "split" ? 700 : 920;
  ctx.fillStyle = style.palette.text;
  ctx.font = `800 ${fontSize}px 'Helvetica Neue', Arial, sans-serif`;
  ctx.textBaseline = "top";
  ctx.textAlign = centered ? "center" : "left";
  const lines = wrapText(ctx, title || "Evento", maxWidth, 4);
  const lineHeight = fontSize + 10;
  const startY = style.layout === "poster" ? 340 : style.layout === "orbit" ? 350 : 330;
  const x = centered ? 540 : 70;
  lines.forEach((line, index) => ctx.fillText(line, x, startY + index * lineHeight, maxWidth));
  ctx.textAlign = "left";
}

function drawInfo(ctx: CanvasRenderingContext2D, data: FallbackFlyerData, style: FallbackFlyerStyle, size: number) {
  const { palette, layout } = style;
  const when = [data.date, data.startTime].filter((value) => typeof value === "string" && value.trim()).join("  •  ") || "A confirmar";
  const where = data.location?.trim() || "A confirmar";
  const x = layout === "split" ? 560 : 54;
  const y = size - 260;
  const width = layout === "split" ? 466 : 972;

  roundedRect(ctx, x, y, width, 206, layout === "poster" ? 28 : 10);
  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.fill();
  ctx.fillStyle = palette.accent;
  ctx.fillRect(x + 28, y + 28, 64, 6);

  const drawLine = (label: string, value: string, lineY: number) => {
    ctx.fillStyle = palette.muted;
    ctx.font = "600 19px 'Helvetica Neue', Arial, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText(label.toUpperCase(), x + 28, lineY);
    ctx.fillStyle = palette.text;
    ctx.font = `700 ${layout === "split" ? 27 : 31}px 'Helvetica Neue', Arial, sans-serif`;
    ctx.fillText(value, x + 28, lineY + 25, width - 56);
  };
  drawLine("Quando", when, y + 51);
  drawLine("Onde", where, y + 126);
}

export async function generateFallbackFlyer(data: FallbackFlyerData): Promise<string> {
  const size = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não disponível");

  const style = pickFallbackFlyerStyle();
  drawBackground(ctx, style, size);
  const logo = await loadImage(LOGO_URL);
  drawBrand(ctx, logo, style);
  drawCategory(ctx, data.category, style);
  drawTitle(ctx, data.title, style);
  drawInfo(ctx, data, style, size);

  return canvas.toDataURL("image/jpeg", 0.85);
}