import { useQuery } from "@tanstack/react-query";
import { getAdPhotoUrls } from "@/lib/adPhotos";

/** Links de exibição das fotos de anúncio, em cache por 6 dias. */
export function useAdPhotoUrls(paths: string[] | null | undefined) {
  const safePaths = Array.isArray(paths)
    ? paths.filter((path): path is string => typeof path === "string" && path.trim().length > 0)
    : [];
  const chave = [...safePaths].sort().join("|");
  return useQuery({
    queryKey: ["ad-photo-urls", chave],
    enabled: safePaths.length > 0,
    staleTime: 6 * 24 * 60 * 60 * 1000,
    queryFn: () => getAdPhotoUrls(safePaths),
  });
}

/** Primeira foto do anúncio (capa) — undefined quando não há foto. */
export function useAdCoverUrl(paths: string[] | null | undefined): string | undefined {
  const safePaths = Array.isArray(paths) ? paths : [];
  const { data } = useAdPhotoUrls(safePaths.slice(0, 1));
  return safePaths[0] ? data?.[safePaths[0]] : undefined;
}
