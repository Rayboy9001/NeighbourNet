import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Send, Image, X, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/hooks/use-auth";
import {
  fetchSquares,
  fetchThreads,
  fetchThreadMessages,
  fetchBlockedIds,
  fetchMyMemberships,
  uploadSquareImage,
  toggleReaction,
  editMessage,
  deleteMessage,
  reportMessage,
  setBlock,
  votePoll,
  markRead,
  type EnrichedMessage,
} from "@/lib/square.client";
import { joinSquareRoom as joinSquareRoomFn, sendSquareMessage as sendSquareMessageFn } from "@/lib/square.functions";
import { MessageBubble } from "@/components/square/MessageBubble";
import { checkContentPolicy, checkImageFile, type Square, type SquareThread } from "@/lib/square";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/square/$slug")({
  head: () => ({
    meta: [
      { title: "Square · NeighbourNet" },
      { name: "description", content: "Join the neighbourhood conversation." },
    ],
  }),
  component: SquareChatPage,
});

function SquareChatPage() {
  const { slug } = useParams({ from: "/_authenticated/square/$slug" });
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const [square, setSquare] = useState<Square | null>(null);
  const [threads, setThreads] = useState<SquareThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<EnrichedMessage[]>([]);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<EnrichedMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const joinSquare = useServerFn(joinSquareRoomFn);
  const sendMessage = useServerFn(sendSquareMessageFn);

  useEffect(() => {
    async function load() {
      const all = await fetchSquares();
      const found = all.find((s) => s.slug === slug) ?? null;
      setSquare(found);
      if (!found || !user) {
        setLoading(false);
        return;
      }
      const [ths, mems] = await Promise.all([
        fetchThreads(found.id),
        fetchMyMemberships(user.id),
      ]);
      await joinSquare({ data: { squareId: found.id } }).catch(() => {});
      const active = ths[0]?.id ?? null;
      setActiveThreadId(active);
      if (active) {
        const [msgs, { blocked: b, muted: m }] = await Promise.all([
          fetchThreadMessages(active, user.id),
          fetchBlockedIds(user.id),
        ]);
        setMessages(msgs);
        setBlocked(b);
        setMuted(m);
        await markRead(active, user.id);
      }
      setLoading(false);
    }
    load();
  }, [slug, user]);

  useEffect(() => {
    if (!activeThreadId || !user) return;
    const channel = supabase
      .channel(`square:${activeThreadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "square_messages", filter: `thread_id=eq.${activeThreadId}` },
        async () => {
          const msgs = await fetchThreadMessages(activeThreadId, user.id);
          setMessages(msgs);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "square_messages", filter: `thread_id=eq.${activeThreadId}` },
        async () => {
          const msgs = await fetchThreadMessages(activeThreadId, user.id);
          setMessages(msgs);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "square_reactions" },
        async () => {
          const msgs = await fetchThreadMessages(activeThreadId, user.id);
          setMessages(msgs);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeThreadId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!user || !square || !activeThreadId || (!body.trim() && !pendingImage)) return;
    const check = checkContentPolicy(body);
    if (!check.ok) {
      setError(check.reason ?? "Message not allowed");
      return;
    }
    setSending(true);
    setError(null);
    try {
      let imagePath: string | null = null;
      if (pendingImage) {
        imagePath = await uploadSquareImage(pendingImage, user.id);
      }
      await sendMessage({
        data: {
          squareId: square.id,
          threadId: activeThreadId,
          body: body.trim(),
          imagePath,
          replyToId: replyTo?.id ?? null,
        },
      });
      setBody("");
      setPendingImage(null);
      setReplyTo(null);
      const msgs = await fetchThreadMessages(activeThreadId, user.id);
      setMessages(msgs);
      await markRead(activeThreadId, user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send message");
    } finally {
      setSending(false);
    }
  }

  async function handleReact(messageId: string, emoji: string, on: boolean) {
    if (!user) return;
    await toggleReaction(messageId, user.id, emoji, on);
    if (!activeThreadId) return;
    const msgs = await fetchThreadMessages(activeThreadId, user.id);
    setMessages(msgs);
  }

  async function handleEdit(messageId: string, newBody: string) {
    if (!user || !activeThreadId) return;
    await editMessage(messageId, newBody);
    const msgs = await fetchThreadMessages(activeThreadId, user.id);
    setMessages(msgs);
  }

  async function handleDelete(messageId: string) {
    if (!user || !activeThreadId) return;
    await deleteMessage(messageId);
    const msgs = await fetchThreadMessages(activeThreadId, user.id);
    setMessages(msgs);
  }

  async function handleReport(messageId: string) {
    if (!user || !activeThreadId) return;
    const reason = window.prompt("Why are you reporting this message?");
    if (!reason) return;
    await reportMessage(messageId, user.id, reason);
    alert("Report submitted.");
  }

  async function handleBlock(targetId: string) {
    if (!user) return;
    await setBlock(user.id, targetId, "block");
    setBlocked((prev) => new Set([...prev, targetId]));
  }

  async function handleMute(targetId: string) {
    if (!user) return;
    await setBlock(user.id, targetId, "mute");
    setMuted((prev) => new Set([...prev, targetId]));
  }

  async function handleVote(pollId: string, optionIndex: number) {
    if (!user || !activeThreadId) return;
    await votePoll(pollId, user.id, optionIndex);
    const msgs = await fetchThreadMessages(activeThreadId, user.id);
    setMessages(msgs);
  }

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = checkImageFile(file);
    if (!check.ok) {
      setError(check.reason ?? "Invalid image");
      return;
    }
    setPendingImage(file);
    setError(null);
  }

  const activeThread = threads.find((t) => t.id === activeThreadId);
  const visibleMessages = messages.filter((m) => {
    if (m.hidden) return true;
    if (m.user_id && blocked.has(m.user_id)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-96 rounded-2xl bg-card border border-border animate-pulse" />
      </div>
    );
  }

  if (!square) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold">Square not found</h2>
        <p className="text-muted-foreground mt-2">That neighbourhood square doesn't exist.</p>
        <Link to="/square" className="inline-block mt-4 text-primary font-medium hover:underline">
          Browse squares
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] -mx-4 md:-mx-8 -my-6 md:-my-10 md:py-0">
      {/* Header */}
      <div className="px-4 md:px-8 py-4 border-b border-border bg-background/95 backdrop-blur flex items-center gap-3 shrink-0">
        <Link
          to="/square"
          className="h-9 w-9 rounded-full border border-border grid place-items-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="font-semibold truncate flex items-center gap-2">
            <span>{square.emoji}</span> {square.name}
          </h1>
          <p className="text-xs text-muted-foreground truncate">{square.area_label}</p>
        </div>
      </div>

      {/* Thread tabs */}
      {threads.length > 0 && (
        <div className="px-4 md:px-8 py-2 border-b border-border flex gap-2 overflow-x-auto shrink-0">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setActiveThreadId(thread.id)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                activeThreadId === thread.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <Hash className="h-3 w-3" />
              <span>{thread.emoji}</span>
              <span>{thread.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-4">
        {activeThread ? (
          <>
            <div className="text-center text-xs text-muted-foreground py-2">
              #{activeThread.title} — {activeThread.emoji}
            </div>
            <AnimatePresence initial={false}>
              {visibleMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isMine={message.user_id === user?.id}
                  onReply={() => setReplyTo(message)}
                  onReact={(emoji, on) => handleReact(message.id, emoji, on)}
                  onEdit={(newBody) => handleEdit(message.id, newBody)}
                  onDelete={() => handleDelete(message.id)}
                  onReport={() => handleReport(message.id)}
                  onBlock={() => message.user_id && handleBlock(message.user_id)}
                  onMute={() => message.user_id && handleMute(message.user_id)}
                  onVote={(index) => message.poll && handleVote(message.poll.id, index)}
                />
              ))}
            </AnimatePresence>
            {messages.some((m) => m.user_id && muted.has(m.user_id)) && (
              <div className="text-center text-xs text-muted-foreground py-2">
                Some messages from muted neighbours are hidden.
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            No threads in this square yet.
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="px-4 md:px-8 py-3 border-t border-border bg-background shrink-0">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2"
          >
            {error}
          </motion.div>
        )}
        {replyTo && (
          <div className="mb-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs">
            <span className="text-muted-foreground truncate">
              Replying to {replyTo.is_bot ? "NeighbourBot" : replyTo.author?.name ?? "Neighbour"}
            </span>
            <button onClick={() => setReplyTo(null)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {pendingImage && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs">
            <span className="text-muted-foreground truncate">{pendingImage.name}</span>
            <button onClick={() => setPendingImage(null)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 w-10 rounded-full border border-border grid place-items-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <Image className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleImagePick}
          />
          <div className="flex-1">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message your neighbours..."
              className="w-full rounded-full border border-border bg-muted px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            type="submit"
            disabled={sending || (!body.trim() && !pendingImage)}
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center disabled:opacity-50 transition-transform active:scale-95"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
