import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import { Link, useLocation } from "react-router-dom";
import { isTabBarHidden, OPEN_KOE_EVENT } from "@/components/layout/MobileTabBar";
import { MessageCircle, X, Send, Square, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const QUICK_PROMPTS = ["Rolês de hoje", "Música ao vivo", "Um barzinho"];


export function CoezinhoChat({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

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
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  };

  const { pathname } = useLocation();
  const inTabBar = !isTabBarHidden(pathname);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_KOE_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_KOE_EVENT, onOpen);
  }, []);

  return (
    <>
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          aria-label="Falar com o Guia do Coé"
          className={cn(
            "fixed bottom-6 right-4 z-50 items-center gap-2 rounded-full bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-lg transition hover:scale-105",
            inTabBar ? "hidden md:flex" : "flex",
          )}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm">Guia do Coé</span>
        </Button>
      )}

      {open && (
        <div className="fixed inset-x-2 bottom-2 z-50 flex h-[75vh] flex-col overflow-hidden rounded-2xl border border-primary/30 bg-card text-card-foreground shadow-elevated sm:inset-x-auto sm:bottom-4 sm:right-4 sm:h-[560px] sm:w-[390px]">
          <div className="gradient-guide-header flex items-center justify-between border-b border-primary/40 px-4 py-4 text-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/30 bg-foreground/10 text-lg shadow-sm">🌴</div>
              <div>
                <p className="font-display text-base font-bold leading-tight">Guia do Coé</p>
                <p className="text-xs font-medium text-foreground/80">Teu parceiro de rolê</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="rounded-full text-foreground hover:bg-foreground/15 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="rounded-lg border border-border bg-muted/50 p-4 shadow-sm">
                <p className="text-sm font-medium leading-relaxed text-foreground">
                  🌴 Coé! Seja bem-vindo! Coé a boa de hoje? Tá afim de fazer o que, um rolêzinho pra agitar? Me conta o que você procura.
                </p>
              </div>
            )}

            {messages.map((m) => {
              const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
              if (!text) return null;
              return m.role === "user" ? (
                <div key={m.id} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                  {text}
                </div>
              ) : (
                <div key={m.id} className="prose prose-sm max-w-none text-sm text-foreground prose-p:my-1 prose-ul:my-1 prose-strong:text-foreground prose-a:text-primary dark:prose-invert">
                  <ReactMarkdown
                    components={{
                      a: ({ href, children }) =>
                        href?.startsWith("/evento/") ? (
                          <Button asChild size="sm" className="my-2 rounded-full">
                            <Link to={href} onClick={() => setOpen(false)}>
                              {children}
                            </Link>
                          </Button>
                        ) : href?.startsWith("/") ? (
                          <Link to={href} onClick={() => setOpen(false)} className="font-semibold text-primary underline">
                            {children}
                          </Link>
                        ) : (
                          <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">
                            {children}
                          </a>
                        ),
                    }}
                  >
                    {text}
                  </ReactMarkdown>
                </div>
              );
            })}

            {status === "submitted" && (
              <div className="flex gap-1 px-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border bg-background/80 px-3 pb-3 pt-2 backdrop-blur-sm">
            {messages.length === 0 && (
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1" aria-label="Sugestões rápidas">
                {QUICK_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => send(prompt)}
                    disabled={busy}
                    className="h-9 shrink-0 rounded-full bg-card px-3 text-xs shadow-none"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {prompt}
                  </Button>
                ))}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder="Fala comigo…"
                className="max-h-28 min-h-[44px] flex-1 resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button
                type={busy ? "button" : "submit"}
                onClick={busy ? () => stop() : undefined}
                aria-label={busy ? "Parar" : "Enviar"}
                disabled={!busy && !input.trim()}
                size="icon"
                className="h-11 w-11 shrink-0 rounded-lg"
              >
                {busy ? <Square className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
