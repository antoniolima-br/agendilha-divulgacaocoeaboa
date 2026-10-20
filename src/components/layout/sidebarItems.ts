import React from "react";
import { 
  CalendarDays, 
  Users, 
  History, 
  ClipboardList,
  ShieldCheck,
  Crown,
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
  CheckCircle2,
  UserRound,
  BriefcaseBusiness,
  Wallet,
  Radar,
  Share2,
  Tag
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
    id: "intranet", title: "Bastidores", roles: ["master", "senior", "financeiro", "sector"],
    items: [{
      id: "intranet_portal", label: "Gestão setorial", path: ROUTES.INTRANET, icon: Building2, roles: ["master", "senior", "financeiro", "sector"],
      children: [
        { id: "sector_portal", label: "Abrir gestão", path: ROUTES.INTRANET, icon: Building2, roles: ["master", "senior", "financeiro", "sector"], exact: true },
      ],
    }],
  },
  {
    id: "explorar",
    title: "Explorar",
    roles: ["public_guest", "public_registered", "promoter", "collaborator", "admin", "senior", "financeiro", "master"],
    items: [
      { id: "agenda", label: "Todos os Eventos", path: ROUTES.AGENDA, icon: CalendarDays, roles: ["public_guest", "public_registered", "promoter", "collaborator", "admin", "senior", "financeiro", "master"] },
      { id: "seu_radar", label: "Meu Radar", path: ROUTES.SEU_RADAR, icon: Radar, roles: ["public_guest", "public_registered", "promoter", "collaborator"] },
      {
        id: "cadastros_explorar",
        label: "Cadastros",
        path: ROUTES.PROMOTOR_ATRATIVOS,
        icon: FolderKanban,
        roles: ["collaborator"],
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
      { id: "share_my_events", label: "Compartilhar meus eventos", path: ROUTES.COMPARTILHAR_MEUS_EVENTOS, exact: true, icon: Share2, roles: ["promoter", "collaborator", "admin", "senior", "master"] },
      { id: "ad_plans_catalog", label: "Valores para anunciar", path: ROUTES.PLANOS_ANUNCIOS, exact: true, icon: Tag, roles: ["promoter", "collaborator", "admin", "senior", "master"] },
    ]
  },
  {
    id: "apresentacoes",
    title: "Apresentações",
    roles: ["public_guest", "public_registered", "promoter", "collaborator", "admin", "senior", "financeiro", "master"],
    items: [
      { id: "pitch_socios", label: "Pitch para Sócios", path: ROUTES.ADMIN_PITCH_SOCIOS, icon: BriefcaseBusiness, roles: ["public_guest", "public_registered", "promoter", "collaborator", "admin", "senior", "financeiro", "master"], exact: true },
      { id: "pitch_anunciantes", label: "Pitch para Anunciantes", path: ROUTES.ADMIN_PITCH_ANUNCIANTES, icon: Megaphone, roles: ["public_guest", "public_registered", "promoter", "collaborator", "admin", "senior", "financeiro", "master"], exact: true },
    ],
  },
  {
    id: "curadoria", title: "Curadoria", roles: ["admin", "senior", "master"],
    items: [{
      id: "curadoria_moderacao", label: "Curadoria e Moderação", path: ROUTES.ADMIN_CENTRAL, icon: ShieldCheck, roles: ["admin", "senior", "master"],
      children: [
        { id: "central_moderacao", label: "Eventos e flyers", path: ROUTES.ADMIN_CENTRAL, icon: ShieldCheck, roles: ["admin", "senior", "master"], exact: true },
        { id: "agenda_informa", label: "Relatório diário", path: ROUTES.ADMIN_AGENDA_INFORMA, icon: ClipboardList, roles: ["admin", "senior", "master"], exact: true },
        { id: "carrossel", label: "Carrossel WhatsApp", path: ROUTES.CARROSSEL, icon: Images, roles: ["admin", "senior", "master"] },
        { id: "whatsapp_templates", label: "Templates WhatsApp", path: ROUTES.ADMIN_WHATSAPP_TEMPLATES, icon: MessageSquare, roles: ["admin", "senior", "master"] },
      ],
    }],
  },
  {
    id: "marketing", title: "Marketing", roles: ["admin", "senior", "financeiro", "master"],
    items: [
      { id: "marketing_setorial", label: "Painel de Marketing", path: `${ROUTES.INTRANET}/marketing`, icon: Megaphone, roles: ["master"] },
      { id: "anuncios_admin", label: "Anúncios e banners", path: ROUTES.ADMIN_ANUNCIOS, icon: LayoutDashboard, roles: ["admin", "senior", "financeiro", "master"], exact: true },
      { id: "destaques_admin", label: "Destaques e promoções", path: ROUTES.ADMIN_DESTAQUES, icon: CheckCircle2, roles: ["admin", "senior", "master"] },
    ],
  },
  {
    id: "comercial", title: "Comercial", roles: ["admin", "financeiro", "senior", "master"],
    items: [
      { id: "comercial_setorial", label: "Clientes e pós-venda", path: `${ROUTES.INTRANET}/comercial`, icon: BriefcaseBusiness, roles: ["master"] },
      { id: "planos_anuncio_admin", label: "Publicidade e pacotes", path: ROUTES.ADMIN_PLANOS_ANUNCIO, icon: ShoppingBag, roles: ["admin", "senior", "financeiro", "master"] },
    ],
  },
  {
    id: "financeiro", title: "Financeiro", roles: ["admin", "financeiro", "senior", "master"],
    items: [
      { id: "financeiro_admin", label: "Conciliação e caixa", path: ROUTES.ADMIN_FINANCEIRO, icon: Wallet, roles: ["admin", "financeiro", "senior", "master"] },
      { id: "pagamentos_destaque_admin", label: "Pagamentos de eventos", path: ROUTES.ADMIN_PAGAMENTOS_DESTAQUE, icon: CreditCard, roles: ["admin", "senior", "financeiro", "master"] },
    ],
  },
  {
    id: "configuracoes", title: "Configurações", roles: ["admin", "senior", "master"],
    items: [
      { id: "configuracoes_admin", label: "Configurações do app", path: ROUTES.ADMIN_CONFIGURACOES, icon: Settings2, roles: ["senior", "master"] },
      {
        id: "governance_records",
        label: "Usuários e cadastros",
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
