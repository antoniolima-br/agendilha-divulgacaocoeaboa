import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, MessageCircle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { addDaysToISO, eventDateISO, PUBLIC_EVENT_STATUSES, saoPauloTodayISO } from "@/lib/eventDate";
import { buildCoeaboaDailyReport, buildWhatsAppShareUrl, SummaryEvent } from "@/lib/todayWhatsappSummary";
import { ROUTES } from "@/routes/config";

type ShareState = "loading" | "ready" | "empty" | "error";

interface DailyEvent extends SummaryEvent {
  id: string;
}

export default function CompartilharAgendaInforma() {
  const [state, setState] = useState<ShareState>("loading");
  const [shareUrl, setShareUrl] = useState("");
  const redirectedRef = useRef(false);

  const prepareShare = useCallback(async () => {
    setState("loading");
    redirectedRef.current = false;
    const today = saoPauloTodayISO();
    const { data, error } = await supabase
      .from("submissions")
      .select(
        "id, status, event_title, date, start_time, location, address_street, address_number, address_neighborhood, atrativo_name, submission_atrativos(name, display_order)",
      )
      .in("status", [...PUBLIC_EVENT_STATUSES])
      .gte("date", addDaysToISO(today, -1))
      .lt("date", addDaysToISO(today, 1))
      .order("start_time", { ascending: true, nullsFirst: false });

    if (error) {
      setState("error");
      return;
    }

    const events = ((data as DailyEvent[] | null) ?? []).filter(
      (event) => eventDateISO(event.date) === today,
    );
    const report = buildCoeaboaDailyReport(events, today);

    if (report.count === 0) {
      setState("empty");
      return;
    }

    setShareUrl(buildWhatsAppShareUrl(report.text));
    setState("ready");
  }, []);

  useEffect(() => {
    void prepareShare();
  }, [prepareShare]);

  useEffect(() => {
    if (state !== "ready" || !shareUrl || redirectedRef.current) return;
    redirectedRef.current = true;
    window.location.assign(shareUrl);
  }, [shareUrl, state]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4 py-12">
      <section className="w-full text-center" aria-live="polite">
        {state === "loading" && (
          <>
            <Loader2 className="mx-auto mb-5 h-10 w-10 animate-spin text-primary" />
            <h1 className="text-2xl font-bold">Preparando o Agendilha Informa</h1>
            <p className="mt-2 text-sm text-muted-foreground">Buscando os eventos válidos de hoje...</p>
          </>
        )}

        {state === "ready" && (
          <>
            <MessageCircle className="mx-auto mb-5 h-10 w-10 text-primary" />
            <h1 className="text-2xl font-bold">Abrindo o WhatsApp</h1>
            <p className="mt-2 text-sm text-muted-foreground">A programação já está pronta na mensagem.</p>
            <Button asChild className="mt-6">
              <a href={shareUrl}>Abrir WhatsApp</a>
            </Button>
          </>
        )}

        {state === "empty" && (
          <>
            <h1 className="text-2xl font-bold">Nada para compartilhar hoje</h1>
            <p className="mt-2 text-sm text-muted-foreground">Nenhum evento aprovado foi encontrado para a data de hoje.</p>
          </>
        )}

        {state === "error" && (
          <>
            <h1 className="text-2xl font-bold">Não deu para preparar a mensagem</h1>
            <p className="mt-2 text-sm text-muted-foreground">Tente novamente para buscar a programação atualizada.</p>
            <Button onClick={() => void prepareShare()} className="mt-6">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </>
        )}

        {state !== "loading" && (
          <Button asChild variant="ghost" className="mt-4">
            <Link to={ROUTES.ADMIN_AGENDA_INFORMA}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao relatório
            </Link>
          </Button>
        )}
      </section>
    </main>
  );
}