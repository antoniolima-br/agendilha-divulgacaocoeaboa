import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Loader2, LockKeyhole, UnlockKeyhole } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { callEdge } from "@/lib/edge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PitchContentView } from "./admin-pitch/PitchContentView";
import type { PitchContent } from "./admin-pitch/types";

export default function AdminPitchComercial() {
  const { user, mustChangePassword } = useAuth();
  const { hasPermission } = useAppPermissions();
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState<{ content: PitchContent; userId: string; expiresAt: number } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const allowed = !!user && !mustChangePassword && hasPermission("pitch.read");
  const content = allowed && unlocked?.userId === user?.id ? unlocked?.content : null;

  useEffect(() => {
    if (!allowed || unlocked?.userId !== user?.id) setUnlocked(null);
  }, [allowed, user?.id, unlocked?.userId]);
  useEffect(() => {
    if (!unlocked) return;
    const timer = window.setTimeout(() => setUnlocked(null), Math.max(0, unlocked.expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [unlocked]);

  async function unlock(event: React.FormEvent) {
    event.preventDefault();
    if (!allowed || !user || pending || !password) return;
    const userId = user.id;
    setPending(true);
    setError("");
    try {
      const result = await callEdge<{ content: PitchContent; expiresInSeconds: number }>("commercial-pitch", { password });
      setUnlocked({ content: result.content, userId, expiresAt: Date.now() + result.expiresInSeconds * 1000 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não deu para abrir. Tente novamente.");
    } finally { setPassword(""); setPending(false); }
  }

  return <div className="mx-auto w-full min-w-0 max-w-5xl space-y-8 pb-12">
    <Helmet><title>Pitch Comercial e Projeção | Coé a Boa?</title><meta name="robots" content="noindex, nofollow, noarchive" /><meta name="description" content="Área comercial interna e restrita do Coé a Boa?." /></Helmet>
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
      <div className="min-w-0 space-y-2"><p className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5" /> Uso interno · Admin, Financeiro, Master e Sênior</p><h1 className="break-words text-2xl font-semibold sm:text-3xl">Pitch Comercial e Projeção</h1><p className="text-sm text-muted-foreground">Coé a Boa? · Estratégia comercial</p></div>
      {content && <Button variant="outline" size="sm" onClick={() => setUnlocked(null)} className="gap-2"><LockKeyhole className="h-4 w-4" /> Bloquear</Button>}
    </header>
    {content ? <PitchContentView content={content} /> : <section className="mx-auto max-w-sm space-y-5 py-10">
      <LockKeyhole className="h-8 w-8 text-primary" />
      <h2 className="text-xl font-semibold">Acesso ao pitch</h2>
      <form onSubmit={unlock} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="pitch-password">Senha do pitch</Label><Input id="pitch-password" type="password" autoComplete="off" maxLength={256} value={password} onChange={(e) => setPassword(e.target.value)} disabled={pending || !allowed} required aria-describedby={error ? "pitch-error" : undefined} /></div>
        {error && <p id="pitch-error" role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={pending || !password || !allowed} className="w-full gap-2">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UnlockKeyhole className="h-4 w-4" />}{pending ? "Conferindo…" : "Abrir pitch"}</Button>
      </form>
    </section>}
  </div>;
}
