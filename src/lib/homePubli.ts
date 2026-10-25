/** Até três imagens de publicidade da Home, cadastradas pela Curadoria. */
export const HOME_PUBLI_KEYS = ["home_publi_1", "home_publi_2", "home_publi_3"] as const;
export const HOME_PUBLI_LABELS = ["Anúncio Principal", "Anúncio Secundário 1", "Anúncio Secundário 2"] as const;

export function homePubliList(settings: Record<string, string> | undefined | null): string[] {
  return HOME_PUBLI_KEYS.map((k) => (settings?.[k] ?? "").trim()).filter((v) => v.startsWith("storage:publi/"));
}

/** Rodízio: um número sorteado por abertura do app escolhe qual imagem aparece. */
const sessionSeed = Math.floor(Math.random() * 1000);
export function pickPubli(list: string[], seed = sessionSeed): string | null {
  return list.length ? list[seed % list.length] : null;
}
