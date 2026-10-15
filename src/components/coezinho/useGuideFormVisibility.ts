import { useEffect, useState } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { ROUTES } from "@/routes/config";

const formRoutes = [
  ROUTES.ENVIAR_EVENTO, ROUTES.ANUNCIO_NOVO, ROUTES.ANUNCIO_EDITAR,
  ROUTES.CONFIGURAR_ARTISTA, ROUTES.PERFIL, ROUTES.PROMOTOR_PERFIL,
  ROUTES.AUTH, ROUTES.FORGOT_PASSWORD, ROUTES.TROCAR_SENHA,
  ROUTES.CONFIGURACOES, ROUTES.ADMIN_CONFIGURACOES,
];

export function isGuideFormRoute(pathname: string) {
  return pathname === ROUTES.CADASTRO_PROMOTOR ||
    (pathname.startsWith(`${ROUTES.CADASTRO}/`) && pathname !== ROUTES.CADASTRO_SUCESSO) ||
    formRoutes.some(path => Boolean(matchPath({ path, end: true }, pathname)));
}

/** Hide only the avatar; explicit Guide requests remain available. */
export function useGuideFormVisibility() {
  const { pathname } = useLocation();
  const [hasForm, setHasForm] = useState(false);
  useEffect(() => {
    // Known form routes already hide the avatar; no DOM observation is needed.
    if (isGuideFormRoute(pathname)) {
      setHasForm(false);
      return;
    }
    let frame: number | undefined;
    const check = () => {
      const controls = document.querySelectorAll<HTMLElement>(
        'form textarea, form input:not([type="hidden"]):not([type="search"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]), [role="dialog"] textarea, [role="dialog"] input, main input[type="file"]',
      );
      const next = Array.from(controls).some(control => {
        if (control.closest('[aria-labelledby="coezinho-title"]')) return false;
        const container = control.closest('form, [role="dialog"]') ?? control.parentElement;
        return Boolean(container && !container.closest('[hidden], [aria-hidden="true"], [data-state="closed"]') && container.getClientRects().length);
      });
      setHasForm(previous => previous === next ? previous : next);
    };
    check();
    // React updates, streaming text and carousels can mutate the DOM repeatedly.
    // Coalesce layout reads into one check per animation frame.
    const observer = new MutationObserver(() => {
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => {
        frame = undefined;
        check();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-hidden', 'data-state'] });
    return () => {
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [pathname]);
  return isGuideFormRoute(pathname) || hasForm;
}