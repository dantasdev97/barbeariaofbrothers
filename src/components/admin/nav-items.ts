import {
  Gift,
  LayoutDashboard,
  MapPin,
  Package,
  QrCode,
  Scissors,
  Settings,
  Tag,
  Users,
} from "lucide-react";

export type Role = "super_admin" | "manager" | "barbeiro";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Match exato do pathname (ex. "/admin") em vez de startsWith. */
  exact?: boolean;
  /** Roles que veem o item; ausente = todos. */
  roles?: Role[];
  /** Aparece na bottom tab bar nativa (subconjunto curado). */
  tab?: boolean;
};

/** Navegação completa do admin — partilhada por sidebar/drawer e tab bar nativa. */
export const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, roles: ["super_admin", "manager"], tab: true },
  { href: "/admin/operacao", label: "Operação", icon: QrCode, tab: true },
  { href: "/admin/clientes", label: "Clientes", icon: Users, roles: ["super_admin", "manager"], tab: true },
  { href: "/admin/fidelidade", label: "Fidelidade", icon: Gift, roles: ["super_admin", "manager"], tab: true },
  { href: "/admin/barbeiros", label: "Barbeiros", icon: Scissors, roles: ["super_admin", "manager"] },
  { href: "/admin/produtos", label: "Produtos", icon: Package, roles: ["super_admin", "manager"] },
  { href: "/admin/categorias", label: "Categorias", icon: Tag, roles: ["super_admin", "manager"] },
  { href: "/admin/unidades", label: "Unidades", icon: MapPin, roles: ["super_admin"] },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, roles: ["super_admin", "manager"] },
];

/** Filtra o NAV pela role do utilizador. */
export function visibleNav(role: string): NavItem[] {
  return NAV.filter((item) => !item.roles || item.roles.includes(role as Role));
}

/** Subconjunto curado para a bottom tab bar nativa (máx. ~5 destinos). */
export function tabNav(role: string): NavItem[] {
  return visibleNav(role).filter((item) => item.tab);
}

/** Determina se um item está ativo face ao pathname atual. */
export function isNavActive(item: NavItem, pathname: string | null): boolean {
  if (!pathname) return false;
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}
