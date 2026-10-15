// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));

it.each([192, 512])("provides an actual %i square official icon safe for masks", (size) => {
  const icon = manifest.icons.find((entry: { sizes: string }) => entry.sizes === `${size}x${size}`);
  expect(icon?.purpose).toBe("any maskable");
  expect(icon?.type).toBe("image/png");
  const png = readFileSync(`public${icon.src}`);
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(16)).toBe(size);
  expect(png.readUInt32BE(20)).toBe(size);
});

it("keeps installed launch colors aligned with the HTML theme", () => {
  const html = readFileSync("index.html", "utf8");
  const theme = html.match(/name="theme-color" content="([^"]+)"/)?.[1];
  expect(manifest.background_color).toBe(theme);
  expect(manifest.theme_color).toBe(theme);
  expect(manifest.start_url).toBe("/");
  expect(manifest.display).toBe("standalone");
});