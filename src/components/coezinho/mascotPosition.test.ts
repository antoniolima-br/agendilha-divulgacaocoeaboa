import { describe, expect, it } from "vitest";
import { clampMascot, mascotSize, safeMascotPosition } from "./mascotPosition";
describe("mascot positioning", () => {
  it("keeps the mascot inside the viewport and above mobile navigation", () => {
    expect(clampMascot({x:2000,y:2000},390,805,88)).toEqual({x:302,y:629});
    expect(clampMascot({x:-100,y:-100},390,805,88)).toEqual({x:12,y:12});
  });
  it("preserves a free drop location", () => {
    expect(safeMascotPosition({x:50,y:200},390,805,88,[])).toEqual({x:50,y:200});
  });
  it("moves a drop off an important control", () => {
    const result=safeMascotPosition({x:50,y:200},390,805,88,[{left:40,top:190,right:180,bottom:320}]);
    expect(result.x>=184 || result.y>=324 || result.y+mascotSize(390)<=186).toBe(true);
  });
  it("uses compact mobile bounds while preserving desktop size", () => {
    expect(mascotSize(390)).toBe(76);
    expect(mascotSize(1280)).toBe(104);
    expect(clampMascot({x:2000,y:2000},1280,800,16)).toEqual({x:1164,y:668});
  });
});