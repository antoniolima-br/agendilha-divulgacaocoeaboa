import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Landing from "./Landing";
import { addDaysToISO, saoPauloTodayISO } from "@/lib/eventDate";
import { clearGlobalEventFilters, getGlobalEventFilters, setGlobalEventFilters } from "@/hooks/useGlobalEventFilters";
const eventMocks = vi.hoisted(() => ({ data: [] as Record<string, unknown>[] }));
vi.mock("@/data/usePublicEvents", () => ({ usePublicEvents: () => ({ data: eventMocks.data }) }));

class IntersectionObserverMock implements IntersectionObserver {
  root = null;
  rootMargin = "";
  scrollMargin = "";
  thresholds = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-without-profile" } }),
}));

vi.mock("@/hooks/useProfile", () => ({
  useProfile: () => ({
    profile: {
      musical_preferences: { length: vi.fn() },
      event_type_preferences: null,
      followed_styles: undefined,
    },
    loaded: true,
  }),
}));

vi.mock("@/data/useAds", () => ({
  usePublishedFlyerAds: () => ({ data: undefined }),
  usePublishedAds: () => ({ data: undefined, isLoading: false }),
  normalizeAds: (data: unknown) => Array.isArray(data) ? data : [],
}));

vi.mock("@/data/useAdPhotoUrls", () => ({
  useAdPhotoUrls: () => ({ data: undefined }),
  useAdCoverUrl: () => undefined,
}));

vi.mock("@/integrations/supabase/client", () => {
  const result = Promise.resolve({ data: undefined, error: null });
  const chain = new Proxy({}, {
    get: (_target, property) => property === "then"
      ? result.then.bind(result)
      : () => chain,
  });
  return {
    supabase: {
      from: () => chain,
      rpc: vi.fn(),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      })),
      removeChannel: vi.fn(),
    },
  };
});

vi.mock("@/components/Header", () => ({ default: () => <header>Coé a Boa?</header> }));
vi.mock("@/components/PersonalizationDialog", () => ({ PersonalizationDialog: () => null }));
vi.mock("@/components/ShareDialog", () => ({ ShareDialog: () => null }));

describe("Landing sem dados", () => {
  beforeEach(() => { eventMocks.data = []; clearGlobalEventFilters(); });
  it("mostra apenas dias com eventos públicos, inclusive sem flyer, e aplica a data ao clicar", () => {
    const today = saoPauloTodayISO();
    const later = addDaysToISO(today, 2);
    eventMocks.data = [
      { id: 'today', date: today, status: 'publicado', image_url: null },
      { id: 'later', date: later, status: 'aprovado', image_url: null },
      { id: 'pending', date: addDaysToISO(today, 1), status: 'pendente', image_url: null },
    ];
    render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><Landing /></MemoryRouter></QueryClientProvider>);
    const strip = within(screen.getByRole('navigation', { name: 'Dias com rolês' }));
    const days = strip.getAllByRole('button').filter(button => button.hasAttribute('aria-pressed'));
    expect(days).toHaveLength(2);
    fireEvent.click(days[1]);
    expect(getGlobalEventFilters()).toMatchObject({ period: 'custom', date: later });
  });
  it("oculta a barra quando não existe nenhuma data disponível", () => {
    render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><Landing /></MemoryRouter></QueryClientProvider>);
    expect(screen.queryByRole('navigation', { name: 'Dias com rolês' })).not.toBeInTheDocument();
  });
  it("amplia somente a lista textual para datas futuras, sem expor pendentes ou arquivos", () => {
    const today = saoPauloTodayISO();
    const later = addDaysToISO(today, 2);
    setGlobalEventFilters({ period: "custom", date: today });
    eventMocks.data = [
      { id: "today", status: "publicado", date: today, event_title: "Hoje com flyer", image_url: "/today.webp" },
      { id: "later", status: "aprovado", date: later, event_title: "Futuro patrocinado", image_url: "/later.webp", is_highlight: true },
      { id: "pending", status: "pendente", date: later, event_title: "Ainda em revisão" },
      { id: "past", status: "publicado", date: addDaysToISO(today, -1), event_title: "Arquivo privado" },
    ];
    render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><Landing /></MemoryRouter></QueryClientProvider>);
    const list = within(screen.getByRole("list", { name: "Outras programações" }));
    expect(list.getAllByRole("listitem")).toHaveLength(2);
    expect(list.getByText("Hoje com flyer")).toBeInTheDocument();
    expect(list.getByText("Futuro patrocinado")).toBeInTheDocument();
    expect(list.queryByText("Ainda em revisão")).not.toBeInTheDocument();
    expect(list.queryByText("Arquivo privado")).not.toBeInTheDocument();
  });
  it("oferece cada evento sem flyer somente uma vez, na programação textual", () => {
    eventMocks.data = [{ id: "text-only", status: "publicado", event_title: "Rolê sem flyer", date: "2099-01-01", location: "Praça", start_time: "19:00", image_url: null, category: "musica", is_free: false, is_highlight: true }];
    render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><Landing /></MemoryRouter></QueryClientProvider>);
    expect(screen.getAllByRole("heading", { name: "Rolê sem flyer" })).toHaveLength(1);
    expect(screen.getByRole("list", { name: "Outras programações" })).toContainElement(screen.getByRole("heading", { name: "Rolê sem flyer" }));
  });
  it("renderiza sem falhar com coleções ausentes ou malformadas", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Landing />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getAllByText("Coé a Boa?").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Categorias")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Nenhuma outra programação disponível agora. Confira novamente em breve.")).toBeInTheDocument();
    });
    expect(screen.getByText("Ainda não temos sugestões personalizadas")).toBeInTheDocument();
  });

  it("mostra estado vazio quando a consulta devolve null", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Landing />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText("Nenhuma outra programação disponível agora. Confira novamente em breve.")).toBeInTheDocument();
    });
  });
});
