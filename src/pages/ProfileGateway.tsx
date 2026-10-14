import { ArrowRight, Bookmark, Clock3, LogIn, UserPlus } from "lucide-react";
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
    <section className="mx-auto flex min-h-[calc(100dvh-10rem)] max-w-xl items-center px-1 py-8 sm:py-12">
      <div className="w-full space-y-7">
        <header className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/35 bg-primary/10 text-primary">
            <Bookmark className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground sm:text-4xl">
            Seu cantinho no Coé
          </h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Crie sua conta pra salvar buscas, acompanhar seu histórico e deixar seus próximos rolês mais fáceis de encontrar.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-border/80 bg-card/80">
            <CardContent className="flex gap-3 p-4">
              <Bookmark className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h2 className="font-semibold text-foreground">Salve o que curtir</h2>
                <p className="mt-1 text-sm text-muted-foreground">Favoritos e preferências ficam com você.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card/80">
            <CardContent className="flex gap-3 p-4">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h2 className="font-semibold text-foreground">Retome quando quiser</h2>
                <p className="mt-1 text-sm text-muted-foreground">Buscas e histórico sem precisar começar de novo.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Button asChild size="lg" className="min-h-12 w-full font-bold">
            <Link to={ROUTES.CADASTRO_PUBLICO}>
              <UserPlus className="mr-2 h-5 w-5" />
              Criar minha conta
              <ArrowRight className="ml-auto h-4 w-4" />
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