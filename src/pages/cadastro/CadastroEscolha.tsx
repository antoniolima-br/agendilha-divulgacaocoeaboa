import { Link } from "react-router-dom";
import { Bell, Megaphone, Music, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const opcoes = [
  {
    id: "publico",
    titulo: "Quero receber eventos",
    descricao: "Receba novidades e eventos perto de você.",
    icon: Bell,
    rota: "/cadastro/publico",
  },
  {
    id: "divulgador",
    titulo: "Quero divulgar eventos",
    descricao: "Cadastre-se para divulgar os seus rolês.",
    icon: Megaphone,
    rota: "/cadastro-promotor",
  },
  {
    id: "artista",
    titulo: "Sou artista / banda / atração",
    descricao: "Crie seu perfil e fique disponível para oportunidades.",
    icon: Music,
    rota: "/cadastro/artista",
  },
] as const;

export default function CadastroEscolha() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md space-y-8 px-4 py-10 sm:py-16">
        <header className="text-center space-y-3">
          <p className="text-sm font-bold uppercase text-primary">
            Coé a Boa?
          </p>
          <h1 className="text-2xl sm:text-4xl font-black font-display text-foreground leading-tight">
            Como você quer participar?
          </h1>
          <p className="text-base font-medium leading-relaxed text-foreground/85">
            Escolha o perfil que mais combina com você. É rapidinho.
          </p>
        </header>

        <div className="space-y-4">
          {opcoes.map((o) => {
            const Icon = o.icon;
            return (
              <Link
                key={o.id}
                to={o.rota}
                className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card
                  className="border-primary/35 bg-card p-5 shadow-card transition-all duration-200 group-hover:border-primary/70 group-hover:bg-accent/35 group-hover:shadow-gold"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-primary/45 bg-primary text-primary-foreground shadow-sm">
                      <Icon className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold leading-tight text-card-foreground">
                        {o.titulo}
                      </h2>
                      <p className="mt-1 text-sm font-medium leading-relaxed text-card-foreground/80">
                        {o.descricao}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-foreground/80">Já tem cadastro?</p>
          <Button asChild variant="outline" className="min-h-11 min-w-32">
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}