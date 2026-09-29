import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { MessageCircle, X, Send, Square } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


export function CoezinhoChat() {
  const [open, setOpen] = useState(false);
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

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Falar com o Guia do Koé"
          className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-lg transition hover:scale-105 md:bottom-6"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm">Guia do Koé</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-x-2 bottom-2 z-50 flex h-[75vh] flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl sm:inset-x-auto sm:right-4 sm:bottom-4 sm:h-[560px] sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/15 text-lg">🌴</div>
              <div>
                <p className="font-bold leading-tight">Guia do Koé</p>
                <p className="text-xs opacity-80">Teu parceiro de rolê na Ilha</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fechar" className="rounded-full p-2 hover:bg-primary-foreground/15">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm">
                  Coé! Seja bem-vindo 🌴 Qual é a boa de hoje? Tá afim de um som, um barzinho ou um rolê na Ilha? Me conta o que você procura!
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
                        href?.startsWith("/") ? (
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 border-t border-border p-2"
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
              className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type={busy ? "button" : "submit"}
              onClick={busy ? () => stop() : undefined}
              aria-label={busy ? "Parar" : "Enviar"}
              disabled={!busy && !input.trim()}
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40",
              )}
            >
              {busy ? <Square className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
