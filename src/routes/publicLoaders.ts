// These exact loaders are shared by React.lazy and intent preloading.
export const loadAgenda = () => import("@/pages/AgendaCultural");
export const loadEventDetail = () => import("@/pages/EventDetail");
export const loadExplorar = () => import("@/pages/Explorar");
export const loadHighlights = () => import("@/pages/EventosEmDestaque");
export const loadToday = () => import("@/pages/CuradoriaHoje");
