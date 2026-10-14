import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import mascot from "@/assets/coezinho-mascot.png";
import { clampMascot, mascotSize, safeMascotPosition, type Point } from "./mascotPosition";
let lastPosition: Point | null = null;
const viewport = () => ({ width: window.innerWidth, height: window.visualViewport?.height ?? window.innerHeight });
export function MascotLauncher({ onOpen }: { onOpen: () => void }) {
  const { pathname } = useLocation();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const gesture = useRef<{ id: number; start: Point; origin: Point; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [idle, setIdle] = useState(false);
  const [position, setPosition] = useState<Point | null>(null);
  const positionRef = useRef<Point | null>(null);
  const reservedBottom = useCallback(() => {
    const { width, height } = viewport();
    const rect = document.querySelector<HTMLElement>('nav[aria-label="Navegação principal"] > ul')?.getBoundingClientRect();
    return rect && rect.height > 0 ? height - rect.top + 12 : width < 768 ? 88 : 16;
  }, []);
  const place = useCallback((point: Point, avoid: boolean) => {
    const { width, height } = viewport();
    const obstacles = avoid ? Array.from(document.querySelectorAll<HTMLElement>('button, a, input, textarea, select, [role="button"], [data-flyer], img'))
      .filter((el) => el !== buttonRef.current && !buttonRef.current?.contains(el))
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0 && r.top < height && r.bottom > 0 && r.left < width && r.right > 0) : [];
    const next = avoid ? safeMascotPosition(point, width, height, reservedBottom(), obstacles) : clampMascot(point, width, height, reservedBottom());
    positionRef.current = next; setPosition(next); return next;
  }, [reservedBottom]);
  const save = (point: Point) => {
    const { width, height } = viewport();
    lastPosition = { x: point.x / width, y: point.y / height };
  };
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => { if (!gesture.current) setIdle(true); }, 6000);
    };
    const events = ["pointermove", "pointerdown", "keydown", "scroll", "touchstart", "wheel"] as const;
    events.forEach((event) => window.addEventListener(event, wake, { passive: true }));
    wake();
    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, wake));
    };
  }, []);
  useEffect(() => {
    const { width, height } = viewport();
    const size = mascotSize(width);
    let initial = positionRef.current ?? { x: width - size - 16, y: height - size - reservedBottom() - 12 };
    if (!positionRef.current && lastPosition) initial = { x: lastPosition.x * width, y: lastPosition.y * height };
    place(initial, Boolean(lastPosition));
    const resize = () => { if (positionRef.current) place(positionRef.current, true); };
    const keepAboveNavigation = () => { if (positionRef.current) place(positionRef.current, false); };
    const navigation = document.querySelector<HTMLElement>('nav[aria-label="Navegação principal"]');
    const navigationObserver = new ResizeObserver(keepAboveNavigation);
    if (navigation) navigationObserver.observe(navigation);
    window.addEventListener("resize", resize); window.visualViewport?.addEventListener("resize", resize);
    return () => { navigationObserver.disconnect(); window.removeEventListener("resize", resize); window.visualViewport?.removeEventListener("resize", resize); };
  }, [pathname, place, reservedBottom]);
  return <Button ref={buttonRef} type="button" variant="ghost" aria-label="Falar com o Guia do Coé" title="Coezinho · Guia do Coé"
    className="coezinho-fab fixed z-[45] h-[76px] w-[76px] md:h-[104px] md:w-[104px] touch-none select-none rounded-full border-0 bg-transparent p-0 hover:bg-transparent focus-visible:ring-2 focus-visible:ring-primary"
    data-dragging={dragging} data-idle={idle} onFocus={() => setIdle(false)} style={position ? { left: position.x, top: position.y } : { right: 16, bottom: 100 }}
    onPointerDown={(e) => {
      if (e.button !== 0 || !e.isPrimary) return;
      const rect = e.currentTarget.getBoundingClientRect(); suppressClick.current = false;
      gesture.current = { id: e.pointerId, start: { x: e.clientX, y: e.clientY }, origin: { x: rect.left, y: rect.top }, moved: false };
      e.currentTarget.setPointerCapture(e.pointerId);
    }}
    onPointerMove={(e) => {
      const g = gesture.current; if (!g || g.id !== e.pointerId) return;
      const dx = e.clientX - g.start.x, dy = e.clientY - g.start.y;
      if (!g.moved && Math.hypot(dx, dy) < 8) return;
      g.moved = true; suppressClick.current = true; setDragging(true);
      place({ x: g.origin.x + dx, y: g.origin.y + dy }, false);
    }}
    onPointerUp={(e) => {
      const g = gesture.current; if (!g || g.id !== e.pointerId) return;
      gesture.current = null; setDragging(false);
      if (g.moved && positionRef.current) save(place(positionRef.current, true));
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    }}
    onPointerCancel={() => {
      suppressClick.current = true; gesture.current = null; setDragging(false);
      if (positionRef.current) place(positionRef.current, true);
    }}
    onLostPointerCapture={() => { gesture.current = null; setDragging(false); }}
    onClick={(e) => {
      if (e.detail !== 0 && suppressClick.current) { suppressClick.current = false; return; }
      onOpen();
    }}>
    <img src={mascot} alt="" aria-hidden="true" loading="lazy" draggable={false} width={1024} height={1024} className="coezinho-character h-full w-full object-contain" />
  </Button>;
}
