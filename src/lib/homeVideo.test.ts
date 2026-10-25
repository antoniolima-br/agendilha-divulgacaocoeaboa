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
