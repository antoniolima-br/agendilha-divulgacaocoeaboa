import { ArrowRight, Bookmark, CalendarDays, LogIn, SlidersHorizontal, UserRound, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ROUTES } from "@/routes/config";
import ProfileSettings from "./ProfileSettings";

export default function ProfileGateway() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState message="Abrindo seu perfil…" />;
  if (user) return <ProfileSettings />;

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-10rem)] max-w-xl items-start px-1 pb-36 pt-8 sm:items-center sm:py-12">
      <div className="w-full space-y-6">
        <header className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/35 bg-primary/10 text-primary">
            <UserRound className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">Seu status</p>
            <h1 className="mt-1 font-display text-3xl font-black text-foreground sm:text-4xl">Visitante</h1>
          </div>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Você já pode ver todos os rolês divulgados. Crie seu perfil quando quiser personalizar o que aparece pra você.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-border/80 bg-card/80">
            <CardContent className="flex gap-3 p-4">
              <SlidersHorizontal className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h2 className="font-semibold text-foreground">Do seu jeito</h2>
                <p className="mt-1 text-sm text-muted-foreground">Escolha categorias, estilos e bairros.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card/80">
            <CardContent className="flex gap-3 p-4">
              <Bookmark className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h2 className="font-semibold text-foreground">Guarde seus favoritos</h2>
                <p className="mt-1 text-sm text-muted-foreground">Salve os rolês que você não quer perder.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Button asChild size="lg" className="min-h-12 w-full font-bold">
            <Link to={ROUTES.CADASTRO_PUBLICO}>
              <UserPlus className="mr-2 h-5 w-5" />
              Personalizar minhas preferências
              <ArrowRight className="ml-auto h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="min-h-12 w-full font-semibold">
            <Link to={ROUTES.AGENDA}>
              <CalendarDays className="mr-2 h-5 w-5" />
              Continuar como visitante
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="min-h-12 w-full font-semibold">
            <Link to={`${ROUTES.AUTH}?redirect=${encodeURIComponent(ROUTES.PERFIL)}`}>
              <LogIn className="mr-2 h-5 w-5" />
              Já tenho conta
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}