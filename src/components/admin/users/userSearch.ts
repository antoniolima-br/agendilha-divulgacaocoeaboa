import type { UserWithRole } from "./types";

function normalizeSearchValue(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function matchesUserSearch(user: UserWithRole, search: string): boolean {
  const terms = normalizeSearchValue(search).trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const searchableText = normalizeSearchValue([
    user.responsible_name,
    user.email,
    user.phone,
    user.address_neighborhood,
    user.user_type,
    user.status,
    user.company_type,
  ].join(" "));

  return terms.every((term) => searchableText.includes(term));
}