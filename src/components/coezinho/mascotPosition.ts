export const MASCOT_SIZE = 104;
export const mascotSize = (width: number) => width < 768 ? 76 : MASCOT_SIZE;
export interface Point { x: number; y: number }
export interface Obstacle { left: number; top: number; right: number; bottom: number }
export function clampMascot(p: Point, w: number, h: number, bottom: number): Point {
  const size = mascotSize(w);
  return { x: Math.max(12, Math.min(p.x, w - size - 12)), y: Math.max(12, Math.min(p.y, h - size - bottom - 12)) };
}
export function safeMascotPosition(p: Point, w: number, h: number, bottom: number, obstacles: Obstacle[]): Point {
  const desired = clampMascot(p,w,h,bottom);
  const size = mascotSize(w);
  const overlap = (p: Point) => obstacles.reduce((sum,r) => sum + Math.max(0, Math.min(p.x + size,r.right + 4) - Math.max(p.x,r.left - 4)) * Math.max(0, Math.min(p.y + size,r.bottom + 4) - Math.max(p.y,r.top - 4)),0);
  if (!overlap(desired)) return desired;
  let best=desired, score=Infinity;
  for (let y=12;y<=h-size-bottom-12;y+=24) for (let x=12;x<=w-size-12;x+=24) {
    const candidate={x,y}, value=overlap(candidate)*1000+Math.hypot(x-desired.x,y-desired.y);
    if (value<score) {best=candidate;score=value;}
  }
  return best;
}
