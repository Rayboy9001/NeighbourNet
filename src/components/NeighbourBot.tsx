import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How do I report an issue?",
  "What should I do during a power outage?",
  "How can I fix a leaking tap?",
  "How do community points work?",
  "Convert 12 miles to kilometres",
  "Improve my report description",
];

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Hi, I'm **NeighbourBot** 👋\n\nI can help you use NeighbourNet, offer safety tips, suggest simple home fixes, do calculations, and even rewrite your reports to be clearer. What can I help with?",
};

// Very small markdown renderer: **bold**, `code`, line breaks, bullet lists.
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const bullet = /^\s*[-*]\s+(.*)/.exec(line);
    const content = bullet ? bullet[1] : line;
    const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, j) => {
      if (/^\*\*[^*]+\*\*$/.test(p))
        return (
          <strong key={j} className="font-semibold">
            {p.slice(2, -2)}
          </strong>
        );
      if (/^`[^`]+`$/.test(p))
        return (
          <code
            key={j}
            className="px-1 py-0.5 rounded bg-muted text-[0.85em] font-mono"
          >
            {p.slice(1, -1)}
          </code>
        );
      return <span key={j}>{p}</span>;
    });
    if (bullet)
      return (
        <div key={i} className="flex gap-2 pl-1">
          <span className="text-primary">•</span>
          <span>{parts}</span>
        </div>
      );
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return <div key={i}>{parts}</div>;
  });
}

export function NeighbourBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/neighbourbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          context: { path: pathname },
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || data.error) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data.error ?? "Sorry, something went wrong. Please try again.",
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.reply ?? "" },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "I couldn't reach the network. Please check your connection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        aria-label="Open NeighbourBot"
        className={cn(
          "fixed z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-pop ring-4 ring-background",
          // Sit above mobile bottom nav (h-16) + safe area
          "bottom-20 right-4 md:bottom-6 md:right-6",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className={cn(
              "fixed z-50 bg-card border border-border shadow-pop overflow-hidden flex flex-col",
              "inset-x-2 bottom-36 top-16 rounded-2xl",
              "md:inset-auto md:bottom-24 md:right-6 md:top-auto md:h-[600px] md:max-h-[80vh] md:w-[400px]",
            )}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-card">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold leading-tight">NeighbourBot</div>
                <div className="text-xs text-muted-foreground">
                  Your neighbourhood AI helper
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto h-8 w-8 grid place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            >
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3.5 py-2 shadow-card"
                        : "text-foreground",
                    )}
                  >
                    {m.role === "assistant" ? (
                      <div className="space-y-1">{renderMarkdown(m.content)}</div>
                    ) : (
                      m.content
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-1 items-center px-3 py-2">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-2 w-2 rounded-full bg-muted-foreground/50"
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {messages.length === 1 && !loading && (
                <div className="pt-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Try asking
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/40 hover:bg-muted transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="p-3 border-t border-border bg-background/60 backdrop-blur"
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  rows={1}
                  placeholder="Ask NeighbourBot…"
                  className="flex-1 resize-none max-h-32 min-h-[40px] rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={loading}
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim() || loading}
                  whileTap={{ scale: 0.92 }}
                  className={cn(
                    "h-10 w-10 shrink-0 rounded-xl grid place-items-center transition-colors",
                    input.trim() && !loading
                      ? "bg-primary text-primary-foreground shadow-card"
                      : "bg-muted text-muted-foreground",
                  )}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
