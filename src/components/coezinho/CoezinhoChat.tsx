import { getGlobalEventFilters } from "@/hooks/useGlobalEventFilters";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import mascot from "@/assets/coezinho-mascot.png";
import { Link } from "react-router-dom";
import { OPEN_KOE_EVENT } from "@/components/layout/MobileTabBar";
import { X, CalendarDays, CircleHelp, Megaphone, Ticket, BadgeCheck, Music2, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MascotLauncher } from "./MascotLauncher";

const QUICK_PROMPTS = [
  { label: "O que tá rolando hoje?", icon: CalendarDays, text: "Quais eventos estão rolando hoje?" },
  { label: "Onde tem música ao vivo?", icon: Music2, text: "Quais eventos têm música ao vivo?" },
  { label: "Como funciona o app?", icon: CircleHelp, text: "O que posso fazer no app Coé a Boa?" },
  { label: "Quero anunciar minha marca", icon: Megaphone, text: "Como anunciar em um espaço publicitário do app?" },
  { label: "Como divulgar meu evento?", icon: Ticket, text: "Como cadastrar e divulgar meu evento?" },
  { label: "Quero destacar um evento", icon: BadgeCheck, text: "Como funciona a divulgação patrocinada para destacar um evento?" },
];


export function CoezinhoChat({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [input, setInput] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coezinho`,
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }),
    [],
  );

  const { messages, sendMessage, status, stop } = useChat({
    transport,
    onError: () => toast.error("Não rolou falar com o Guia agora. Tenta de novo em instantes."),
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const focus = requestAnimationFrame(() => panelRef.current?.querySelector("textarea")?.focus({ preventScroll: true }));
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const controls = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), textarea, a[href]') ?? []);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", keydown);
    return () => {
      cancelAnimationFrame(focus);
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", keydown);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [open]);

  useEffect(() => {
    if (open && !busy && !document.activeElement?.closest('button, a, input')) {
      panelRef.current?.querySelector("textarea")?.focus({ preventScroll: true });
    }
  }, [open, busy]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    sendMessage({ text: value }, { body: { eventFilters: getGlobalEventFilters() } });
    setInput("");
    panelRef.current?.querySelector("textarea")?.focus({ preventScroll: true });
  };

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_KOE_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_KOE_EVENT, onOpen);
  }, []);

  return (
    <>
      {!open && <MascotLauncher onOpen={() => setOpen(true)} />}
      {open && (
        <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="coezinho-title"
          className="theme-coeaboa fixed inset-0 z-50 flex h-[100dvh] flex-col bg-background text-foreground">
          <header className="shrink-0 border-b border-border px-4 py-3 sm:px-8">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={mascot} alt="Coezinho" className="h-12 w-12 object-contain" />
                <div>
                  <h1 id="coezinho-title" className="font-display text-base font-semibold">Guia do Coé</h1>
                  <p className="text-xs text-muted-foreground">Seu parceiro de rolê</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" aria-label="Fechar" title="Fechar conversa" onClick={() => setOpen(false)}>
                <X />
              </Button>
            </div>
          </header>
          <Conversation className="min-h-0 flex-1" aria-label="Conversa com o Guia do Coé">
            <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-5 py-8 sm:px-8 sm:py-12">
              {messages.length === 0 && (
                <div className="space-y-7">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Coé! Que bom ter você por aqui.</p>
                    <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">Qual é a boa?</h2>
                  </div>
                  <div className="grid gap-3" aria-label="Sugestões rápidas">
                    {QUICK_PROMPTS.map(({ label, text, icon: Icon }) => (
                      <Button key={label} type="button" variant="ghost" onClick={() => send(text)} disabled={busy}
                        className="h-auto min-h-16 justify-start gap-4 whitespace-normal rounded-lg bg-card px-5 py-4 text-left text-base font-medium text-foreground shadow-none hover:bg-muted md:h-auto">
                        <Icon className="h-5 w-5 text-primary" />
                        <span className="min-w-0">{label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((message) => (
                <Message key={message.id} from={message.role} className="max-w-full">
                  <MessageContent className="group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground">
                    {message.parts.map((part, index) => part.type === "text" ? (
                      message.role === "user" ? <p key={index} className="whitespace-pre-wrap break-words">{part.text}</p> :
                      <MessageResponse key={index} isAnimating={status === "streaming" && message.id === messages.at(-1)?.id}
                        components={{ a: ({ href, children }) => href?.startsWith("/") ? (
                          <Link to={href} onClick={() => setOpen(false)} className="font-semibold text-primary underline">{children}</Link>
                        ) : <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">{children}</a> }}>
                        {part.text}
                      </MessageResponse>
                    ) : null)}
                  </MessageContent>
                </Message>
              ))}
              {status === "submitted" && <Shimmer className="text-sm">Coezinho tá pensando…</Shimmer>}
            </ConversationContent>
            <ConversationScrollButton aria-label="Ver últimas mensagens" />
          </Conversation>
          <footer className="shrink-0 border-t border-border bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-8">
            <PromptInput onSubmit={({ text }) => send(text)} className="coezinho-composer mx-auto max-w-3xl">
              <PromptInputTextarea value={input} onChange={(event) => setInput(event.target.value)}
                placeholder="Pergunte ao Coezinho…" aria-label="Sua mensagem" className="px-4 py-3 text-base" />
              <PromptInputFooter className="justify-end px-3 pb-3">
                <PromptInputSubmit status={status} onStop={() => stop()} disabled={!busy && !input.trim()}
                  aria-label={busy ? "Parar" : "Enviar"} title={busy ? "Parar resposta" : "Enviar mensagem"}
                  className="h-10 w-10 shrink-0 rounded-md p-0 md:h-10 md:w-10">
                  {!busy && <ArrowUp className="h-5 w-5" />}
                </PromptInputSubmit>
              </PromptInputFooter>
            </PromptInput>
          </footer>
        </div>
      )}
    </>
  );
}
