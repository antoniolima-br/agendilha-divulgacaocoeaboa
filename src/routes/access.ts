import { ROUTES } from "./config";
import type { PermissionName } from "@/hooks/useAppPermissions";

/** Same capability gates apply to direct navigation and sidebar links. */
export const ROUTE_PERMISSIONS: Record<string, PermissionName> = {
  [ROUTES.ADMIN_EVENTS]: "events.read",
  [ROUTES.ADMIN_PUBLISHED_EVENTS]: "events.read",
  [ROUTES.ADMIN_APROVAR_EVENTOS]: "events.approve",
  [ROUTES.ADMIN_USERS]: "users.read",
  [ROUTES.ADMIN_COLLABORATORS]: "users.update",
  [ROUTES.ADMIN_NEWSLETTER]: "reports.read",
  [ROUTES.ADMIN_ARTISTS]: "events.update",
  [ROUTES.ADMIN_MEDIA]: "events.approve",
  [ROUTES.ADMIN_AGENDA_INFORMA]: "reports.read",
  [ROUTES.ADMIN_AGENDA_INFORMA_COMPARTILHAR]: "reports.read",
  [ROUTES.ADMIN_WHATSAPP_TEMPLATES]: "events.update",
  [ROUTES.ADMIN_DESTAQUES]: "events.approve",
  [ROUTES.ADMIN_PAGAMENTOS_DESTAQUE]: "finance.read",
  [ROUTES.ADMIN_FINANCEIRO]: "finance.read",
  [ROUTES.ADMIN_CONFIGURACOES]: "settings.manage",
  [ROUTES.ADMIN_PITCH_COMERCIAL]: "pitch.read",
  [ROUTES.ADMIN_ROLANDO_AGORA]: "events.read",
  [ROUTES.ADMIN_REPORTS]: "reports.read",
  [ROUTES.ADMIN_ESTABELECIMENTOS]: "events.update",
  [ROUTES.ADMIN_NEGOCIOS]: "events.update",
  [ROUTES.ADMIN_ATRATIVOS]: "events.update",
  [ROUTES.ADMIN_ANUNCIOS]: "ads.manage",
  [ROUTES.ADMIN_PLANOS_ANUNCIO]: "ads.manage",
  [ROUTES.CARROSSEL]: "reports.read",
};