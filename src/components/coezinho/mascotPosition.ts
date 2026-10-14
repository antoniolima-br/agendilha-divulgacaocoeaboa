export const MASCOT_SIZE = 104;
export interface Point { x: number; y: number }
export interface Obstacle { left: number; top: number; right: number; bottom: number }
export function clampMascot(p: Point, w: number, h: number, bottom: number): Point {
  return { x: Math.max(12, Math.min(p.x, w - MASCOT_SIZE - 12)), y: Math.max(12, Math.min(p.y, h - MASCOT_SIZE - bottom - 12)) };
}
export function safeMascotPosition(p: Point, w: number, h: number, bottom: number, obstacles: Obstacle[]): Point {
  const desired = clampMascot(p,w,h,bottom);
  const overlap = (p: Point) => obstacles.reduce((sum,r) => sum + Math.max(0, Math.min(p.x + MASCOT_SIZE,r.right + 4) - Math.max(p.x,r.left - 4)) * Math.max(0, Math.min(p.y + MASCOT_SIZE,r.bottom + 4) - Math.max(p.y,r.top - 4)),0);
  if (!overlap(desired)) return desired;
  let best=desired, score=Infinity;
  for (let y=12;y<=h-MASCOT_SIZE-bottom-12;y+=24) for (let x=12;x<=w-MASCOT_SIZE-12;x+=24) {
    const candidate={x,y}, value=overlap(candidate)*1000+Math.hypot(x-desired.x,y-desired.y);
    if (value<score) {best=candidate;score=value;}
  }
  return best;
}
