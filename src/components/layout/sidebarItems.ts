import React from "react";
import { 
  CalendarDays, 
  Users, 
  History, 
  ClipboardList,
  ShieldCheck,
  Crown,
  PlusCircle,
  LayoutDashboard,
  Eye,
  Megaphone,
  Images,
  MessageSquare,
  Building2,
  FolderKanban,
  ShoppingBag,
  Settings2,
  CreditCard,
  Share2,
  CheckCircle2,
  UserRound
} from "lucide-react";
import { ROUTES } from "@/routes/config";
import { type AccessRole } from "@/lib/access";
import { ROUTE_PERMISSIONS } from "@/routes/access";
import type { PermissionName } from "@/hooks/useAppPermissions";

export type Role = AccessRole;

export interface SidebarItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string | number;
  roles: Role[];
  exact?: boolean;
  children?: SidebarItem[];
}

export interface SidebarSection {
  id: string;
  title: string;
  roles: Role[];
  items: SidebarItem[];
}

export const sidebarConfig: SidebarSection[] = [
  {
    id: "intranet", title: "Portal corporativo", roles: ["admin", "senior", "master", "financeiro", "sector"],
    items: [{
      id: "intranet_portal", label: "Gestão setorial", path: ROUTES.INTRANET, icon: Building2, roles: ["admin", "senior", "master", "financeiro", "sector"],
      children: [
        { id: "sector_portal", label: "Portal setorial", path: ROUTES.INTRANET, icon: Building2, roles: ["admin", "senior", "master", "sector"], exact: true },
        { id: "financeiro", label: "Financeiro", path: ROUTES.ADMIN_FINANCEIRO, icon: CreditCard, roles: ["admin", "senior", "financeiro", "master"] },
      ],
    }],
  },
  {
    id: "explorar",
    title: "Explorar",
    roles: ["public_guest", "public_registered", "promoter", "collaborator", "admin", "senior", "financeiro", "master"],
    items: [
      { id: "agenda", label: "Agenda", path: ROUTES.AGENDA, icon: CalendarDays, roles: ["public_guest", "public_registered", "promoter", "collaborator", "admin", "senior", "financeiro", "master"] },
      {
        id: "cadastros_explorar",
        label: "Cadastros",
        path: ROUTES.PROMOTOR_ATRATIVOS,
        icon: FolderKanban,
        roles: ["promoter", "collaborator"],
        children: [
          {
            id: "artists",
            label: "Atrativos",
            path: ROUTES.PROMOTOR_ATRATIVOS,
            icon: Users,
            roles: ["promoter", "collaborator", "admin", "senior", "master"],
            exact: true
          },
          {
            id: "estabelecimentos_explorar",
            label: "Locais de rolê",
            path: ROUTES.PROMOTOR_ESTABELECIMENTOS,
            icon: Building2,
            roles: ["promoter", "collaborator", "admin", "senior", "master"]
          },
          {
            id: "negocios_explorar",
            label: "Negócios gerais",
            path: ROUTES.PROMOTOR_NEGOCIOS,
            icon: Building2,
            roles: ["promoter", "collaborator", "admin", "senior", "master"]
          }
        ]
      },
    ]
  },
  {
    id: "divulgacao",
    title: "Área do Divulgador",
    roles: ["promoter", "collaborator", "admin", "senior", "master"],
    items: [
      { 
        id: "my_submissions", 
        label: "Meus eventos",
        path: ROUTES.MEUS_EVENTOS,
        exact: true,
        icon: ClipboardList, 
        roles: ["promoter", "collaborator", "admin", "senior", "master"] 
      },
      {
        id: "share_my_events",
        label: "Compartilhar meus eventos",
        path: ROUTES.COMPARTILHAR_MEUS_EVENTOS,
        icon: Share2,
        roles: ["promoter", "collaborator", "admin", "senior", "master"]
      },
      { 
        id: "send_event", 
        label: "Publicar Evento", 
        path: ROUTES.ENVIAR_EVENTO, 
        icon: PlusCircle, 
        roles: ["promoter", "collaborator", "admin", "senior", "master"] 
      },
      { id: "ad_plans_catalog", label: "Planos e valores de anúncios", path: ROUTES.PLANOS_ANUNCIOS, icon: ShoppingBag, roles: ["promoter", "collaborator", "admin", "senior", "master"] }
    ]
  },
  {
    id: "operacao",
    title: "Operação",
    roles: ["admin", "senior", "financeiro", "master"],
    items: [
      { id: "central_moderacao", label: "Curadoria e Moderação", path: ROUTES.ADMIN_CENTRAL, icon: ShieldCheck, roles: ["admin", "senior", "master"] },
      {
        id: "relatorio_diario",
        label: "Relatório Diário (Coé a Boa?)",
        path: ROUTES.ADMIN_AGENDA_INFORMA,
        icon: Megaphone,
        roles: ["admin", "senior", "master"],
        children: [
          {
            id: "agenda_informa",
            label: "AgendIlha Informa",
            path: ROUTES.ADMIN_AGENDA_INFORMA,
            icon: Megaphone,
            roles: ["admin", "senior", "master"],
            exact: true
          },
          {
            id: "carrossel",
            label: "Carrossel WhatsApp",
            path: ROUTES.CARROSSEL,
            icon: Images,
            roles: ["admin", "senior", "master"]
          },
          {
            id: "whatsapp_templates",
            label: "Templates WhatsApp",
            path: ROUTES.ADMIN_WHATSAPP_TEMPLATES,
            icon: MessageSquare,
            roles: ["admin", "senior", "master"]
          }
        ]
      },
      {
        id: "advertising_admin",
        label: "Publicidade e pacotes",
        path: ROUTES.ADMIN_ANUNCIOS,
        icon: ShoppingBag,
        roles: ["admin", "senior", "financeiro", "master"],
        children: [
          { id: "anuncios_admin", label: "Gestão de anúncios", path: ROUTES.ADMIN_ANUNCIOS, icon: LayoutDashboard, roles: ["admin", "senior", "financeiro", "master"], exact: true },
          { id: "planos_anuncio_admin", label: "Pacotes de anúncios", path: ROUTES.ADMIN_PLANOS_ANUNCIO, icon: ShoppingBag, roles: ["admin", "senior", "financeiro", "master"] },
          { id: "destaques_admin", label: "Gestão de destaques", path: ROUTES.ADMIN_DESTAQUES, icon: CheckCircle2, roles: ["admin", "senior", "master"] },
          { id: "pagamentos_destaque_admin", label: "Pagamentos dos destaques", path: ROUTES.ADMIN_PAGAMENTOS_DESTAQUE, icon: CreditCard, roles: ["admin", "senior", "financeiro", "master"] },
        ],
      },
      {
        id: "configuracoes_admin",
        label: "Configurações",
        path: ROUTES.ADMIN_CONFIGURACOES,
        icon: Settings2,
         roles: ["senior", "master"]
      },
    ]
  },
  {
    id: "governanca",
    title: "Governança",
    roles: ["admin", "financeiro", "senior", "master"],
    items: [
      {
        id: "governance_records",
        label: "Administração e cadastros",
        path: ROUTES.ADMIN_USERS,
        icon: FolderKanban,
        roles: ["admin", "senior", "master"],
        children: [
          { id: "divulgadores_admin", label: "Gerenciar usuários", path: ROUTES.ADMIN_USERS, icon: Users, roles: ["admin", "senior", "master"], exact: true },
          { id: "atrativos_admin", label: "Gerenciar atrativos", path: ROUTES.ADMIN_ATRATIVOS, icon: Users, roles: ["admin", "senior", "master"] },
          { id: "estabelecimentos_admin", label: "Gerenciar locais de rolê", path: ROUTES.ADMIN_ESTABELECIMENTOS, icon: Building2, roles: ["admin", "senior", "master"] },
          { id: "negocios_admin", label: "Gerenciar negócios gerais", path: ROUTES.ADMIN_NEGOCIOS, icon: Building2, roles: ["admin", "senior", "master"] },
        ],
      },
      { id: "audit_logs", label: "Logs de Auditoria", path: ROUTES.ADMIN_AUDIT, icon: History, roles: ["admin", "senior", "master"] },
      { id: "pitch_comercial", label: "Pitch Comercial e Projeção", path: ROUTES.ADMIN_PITCH_COMERCIAL, icon: ClipboardList, roles: ["admin", "financeiro", "senior", "master"] },
      { 
        id: "master_panel", 
        label: "Painel Master", 
        path: ROUTES.MASTER_DASHBOARD, 
        icon: Crown, 
        roles: ["master"],
        children: [
          { id: "master_overview", label: "Visão Geral", path: ROUTES.MASTER_DASHBOARD, icon: Eye, roles: ["master"] }
        ]
      }
    ]
  },
  {
    id: "conta",
    title: "Conta",
    roles: ["public_guest", "public_registered", "promoter", "collaborator", "admin", "senior", "financeiro", "master"],
    items: [
      {
        id: "profile",
        label: "Meu Perfil",
        path: ROUTES.PERFIL,
        icon: UserRound,
        roles: ["public_guest", "public_registered", "promoter", "collaborator", "admin", "senior", "financeiro", "master"]
      },
      {
        id: "divulgador_status",
        label: "Seja Divulgador",
        path: ROUTES.CADASTRO_DIVULGADOR,
        icon: Megaphone,
        roles: ["public_guest", "public_registered"]
      }
    ]
  }
];

/** Prunes entire branches, including parents with no authorized children. */
export function filterSidebarSections(
  role: Role,
  hasPermission: (permission: PermissionName) => boolean,
  routeExists: (path: string) => boolean,
): SidebarSection[] {
  const filterItems = (items: SidebarItem[]): SidebarItem[] => items.flatMap((item) => {
    if (!item.roles.includes(role) || !item.path) return [];
    if (["send_event", "my_submissions", "share_my_events", "ad_plans_catalog"].includes(item.id) && !hasPermission("events.create")) return [];
    const children = item.children ? filterItems(item.children) : undefined;
    if (item.children && !children?.length) return [];
    const permission = ROUTE_PERMISSIONS[item.path.split("?")[0]];
    if (!children && permission && !hasPermission(permission)) return [];
    if (!children && !routeExists(item.path)) return [];
    return [{ ...item, path: children?.[0]?.path ?? item.path, children }];
  });
  return sidebarConfig.filter((section) => section.roles.includes(role)).flatMap((section) => {
    const items = filterItems(section.items);
    return items.length ? [{ ...section, items }] : [];
  });
}
/** Match complete segments and query links, not sibling prefixes. */
export function isSidebarItemActive(item: SidebarItem, pathname: string, fullPath: string): boolean {
  if (item.path.includes("?")) return fullPath === item.path;
  if (item.exact) return pathname === item.path;
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}
