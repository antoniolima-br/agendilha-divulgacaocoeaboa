import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Landing from "./Landing";

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
