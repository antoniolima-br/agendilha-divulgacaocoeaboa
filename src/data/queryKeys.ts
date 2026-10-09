/**
 * Centralized React Query keys for the data layer.
 * Keeps cache invalidation explicit and prevents typos in key arrays.
 */
export const qk = {
  permissions: {
    all: ["app-permissions"] as const,
    byUser: (userId: string | null) => [...qk.permissions.all, userId] as const,
  },
  finance: {
    all: ["finance"] as const,
    overview: (userId: string | null) => [...qk.finance.all, userId] as const,
  },
  newsletter: {
    all: ["newsletter"] as const,
    list: () => [...qk.newsletter.all, "list"] as const,
    count: () => [...qk.newsletter.all, "count"] as const,
  },
  adminUsers: {
    all: ["admin-users"] as const,
    list: () => [...qk.adminUsers.all, "list"] as const,
  },
  submissions: {
    all: ["submissions"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...qk.submissions.all, "list", filters ?? {}] as const,
    count: (filters?: Record<string, unknown>) =>
      [...qk.submissions.all, "count", filters ?? {}] as const,
    byId: (id: string) => [...qk.submissions.all, "byId", id] as const,
    mine: (userId: string | undefined) => [...qk.submissions.all, "mine", userId ?? "anon"] as const,
  },
  adminStats: {
    all: ["admin-stats"] as const,
    master: () => [...qk.adminStats.all, "master"] as const,
  },
  curation: {
    all: ["curation"] as const,
    list: (userId: string | undefined, status: string) => [...qk.curation.all, userId ?? "anon", status] as const,
  },
  agenda: {
    all: ["agenda"] as const,
    events: () => [...qk.agenda.all, "events"] as const,
    publicEvents: () => [...qk.agenda.all, "public-events"] as const,
    ratings: () => [...qk.agenda.all, "ratings"] as const,
  },
  home: {
    all: ["home"] as const,
    events: () => [...qk.home.all, "events"] as const,
    freeEvents: () => [...qk.home.all, "free-events"] as const,
    promotionalFlyers: () => [...qk.home.all, "promotional-flyers"] as const,
    todayCount: () => [...qk.home.all, "today-count"] as const,
  },
  favorites: {
    all: ["favorites"] as const,
    byUser: (userId: string | null | undefined) =>
      [...qk.favorites.all, userId ?? "anon"] as const,
  },
  profile: {
    all: ["profile"] as const,
    byUser: (userId: string | null | undefined) =>
      [...qk.profile.all, userId ?? "anon"] as const,
  },
  ads: {
    all: ["ads"] as const,
    published: () => [...qk.ads.all, "publicados"] as const,
    products: () => [...qk.ads.all, "products"] as const,
    mine: (userId: string | null | undefined) => [...qk.ads.all, "meus", userId ?? "anon"] as const,
    list: () => [...qk.ads.all, "todos"] as const,
    byId: (id: string | null | undefined) => [...qk.ads.all, "detalhe", id ?? "none"] as const,
    flyersHome: () => [...qk.ads.all, "flyers-home"] as const,
  },
  highlights: {
    all: ["admin", "highlights"] as const,
    candidates: (search: string) => ["admin", "highlight-candidates", search] as const,
    publicList: () => ["highlights", "public"] as const,
    payments: () => [...qk.highlights.all, "payments"] as const,
  },
  estabelecimentos: {
    all: ["estabelecimentos"] as const,
    mine: (userId: string | null | undefined, listingKind = "event_venue") =>
      [...qk.estabelecimentos.all, "mine", userId ?? "anon", listingKind] as const,
    admin: (listingKind = "event_venue") =>
      [...qk.estabelecimentos.all, "admin", listingKind] as const,
    approved: (search?: string) =>
      [...qk.estabelecimentos.all, "approved", search ?? ""] as const,
  },
  atrativos: {
    all: ["atrativos"] as const,
    mine: (userId: string | null | undefined) =>
      [...qk.atrativos.all, "mine", userId ?? "anon"] as const,
    approved: (search?: string) =>
      [...qk.atrativos.all, "approved", search ?? ""] as const,
  },
  collaborators: {
    all: ["collaborators"] as const,
    list: () => [...qk.collaborators.all, "list"] as const,
  },
  reviews: {
    all: ["event-reviews"] as const,
    byEvent: (eventId: string | null | undefined) =>
      [...qk.reviews.all, "byEvent", eventId ?? "none"] as const,
  },
  userDetails: {
    all: ["user-details"] as const,
    byId: (userId: string | null | undefined) =>
      [...qk.userDetails.all, "byId", userId ?? "none"] as const,
  },
  profileOptions: {
    all: ["profile-options"] as const,
    list: () => [...qk.profileOptions.all, "list"] as const,
  },
  artistMedia: {
    all: ["artist-media"] as const,
    byArtist: (artistId: string | null | undefined) =>
      [...qk.artistMedia.all, "byArtist", artistId ?? "none"] as const,
  },
  divulgador: {
    all: ["divulgador"] as const,
    status: (userId: string | null | undefined) =>
      [...qk.divulgador.all, "status", userId ?? "anon"] as const,
    profile: (userId: string | null | undefined) =>
      [...qk.divulgador.all, "promotor-profile", userId ?? "anon"] as const,
  },
} as const;