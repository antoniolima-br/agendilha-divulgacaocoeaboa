import { describe, expect, it } from "vitest";
import { openingVideo, parseHomeVideo } from "./homeVideo";

describe("vídeo de abertura", () => {
  it("toca uma vez por carregamento e some depois de visto", () => {
    openingVideo.reset();
    expect(openingVideo.shouldPlay()).toBe(true);
    openingVideo.markDone();
    expect(openingVideo.shouldPlay()).toBe(false);
  });
  it("aceita arquivo enviado pela gestão", () => {
    expect(parseHomeVideo("storage:video/1.mp4")?.kind).toBe("file");
  });
  it("recusa link que não é vídeo", () => {
    expect(parseHomeVideo("https://exemplo.com/pagina")).toBeNull();
  });
});

import { homeVideoPlaylist } from "./homeVideo";
describe("lista de vídeos de abertura", () => {
  it("toca só os espaços preenchidos, na ordem 1, 2, 3", () => {
    expect(homeVideoPlaylist({ home_video_url: "", home_video_url_2: "storage:video/b.mp4", home_video_url_3: "storage:video/c.mp4" }))
      .toEqual(["storage:video/b.mp4", "storage:video/c.mp4"]);
  });
  it("ignora mais de três e links inválidos", () => {
    expect(homeVideoPlaylist({ home_video_url: "https://exemplo.com/x", home_video_url_4: "storage:video/d.mp4" })).toEqual([]);
  });
});
