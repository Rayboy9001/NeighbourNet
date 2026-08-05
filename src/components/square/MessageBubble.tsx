import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Ban,
  Check,
  CheckCheck,
  Flag,
  Pencil,
  Reply,
  Smile,
  Trash2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EDIT_WINDOW_MS,
  REACTION_EMOJIS,
  reputationBadges,
  timeLabel,
} from "@/lib/square";
import type { EnrichedMessage } from "@/lib/square-browser";

function Avatar({ name, url, bot }: { name: string; url: string | null; bot?: boolean }) {
  if (bot)
    return (
      <div className="h-9 w-9 shrink-0 rounded-full bg-primary/15 grid place-items-center text-base">
        🤖
      </div>
    );
  return url ? (
    <img src={url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
  ) : (
    <div className="h-9 w-9 shrink-0 rounded-full bg-accent grid place-items-center text-xs font-semibold text-accent-foreground">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function Markdownish({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <p key={i} className="whitespace-pre-wrap break-words">
          {line.split(/(\*\*[^*]+\*\*|@[a-z0-9_.-]{2,32})/gi).map((part, j) => {
            if (/^\*\*[^*]+\*\*$/.test(part))
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            if (/^@[a-z0-9_.-]{2,32}$/i.test(part))
              return (
                <span key={j} className="rounded bg-primary/10 px-1 font-medium text-primary">
                  {part}
                </span>
              );
            return <span key={j}>{part}</span>;
          })}
        </p>
      ))}
    </>
  );
}

export function PollBlock({
  poll,
  onVote,
}: {
  poll: NonNullable<EnrichedMessage["poll"]>;
  onVote: (index: number) => void;
}) {
  const closed = new Date(poll.closes_at) <= new Date();
  return (
    <div className="mt-2 rounded-xl border border-border bg-background/70 p-3 space-y-2">
      <div className="text-sm font-semibold">{poll.question}</div>
      {poll.options.map((opt, i) => {
        const pct = poll.total ? Math.round((poll.counts[i] / poll.total) * 100) : 0;
        const mine = poll.myVote === i;
        return (
          <button
            key={i}
            type="button"
            disabled={closed}
            onClick={() => onVote(i)}
            className={cn(
              "relative w-full overflow-hidden rounded-lg border px-3 py-2 text-start text-sm transition-colors",
              mine ? "border-primary" : "border-border hover:border-primary/50",
              closed && "opacity-70",
            )}
          >
            <span
              className="absolute inset-y-0 start-0 bg-primary/10"
              style={{ width: `${pct}%` }}
            />
            <span className="relative flex items-center justify-between gap-2">
              <span>{opt}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
            </span>
          </button>
        );
      })}
      <div className="text-xs text-muted-foreground">
        {poll.total} vote{poll.total === 1 ? "" : "s"} ·{" "}
        {closed ? "Poll closed" : `Closes ${new Date(poll.closes_at).toLocaleString()}`}
      </div>
    </div>
  );
}

export function SharedReportCard({ report }: { report: NonNullable<EnrichedMessage["report"]> }) {
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-border bg-background/70">
      {report.imageUrl && (
        <img src={report.imageUrl} alt="" className="h-36 w-full object-cover" loading="lazy" />
      )}
      <div className="p-3 space-y-1">
        <div className="text-sm font-semibold leading-snug">{report.title}</div>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground capitalize">
            {report.category}
          </span>
          <span className="rounded-full border border-border px-2 py-0.5 capitalize">
            {report.status.replace(/_/g, " ")}
          </span>
        </div>
        <Link
          to="/reports/$id"
          params={{ id: report.id }}
          className="inline-block pt-1 text-xs font-semibold text-primary hover:underline"
        >
          View report →
        </Link>
      </div>
    </div>
  );
}

export function MessageBubble({
  message,
  isMine,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onReport,
  onBlock,
  onMute,
  onVote,
}: {
  message: EnrichedMessage;
  isMine: boolean;
  onReply: () => void;
  onReact: (emoji: string, on: boolean) => void;
  onEdit: (body: string) => void;
  onDelete: () => void;
  onReport: () => void;
  onBlock: () => void;
  onMute: () => void;
  onVote: (index: number) => void;
}) {
  const [picker, setPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);

  const name = message.is_bot ? "NeighbourBot" : (message.author?.name ?? "Neighbour");
  const badges = message.is_bot
    ? [{ emoji: "🤖", label: "Community assistant" }]
    : reputationBadges({
        points: message.author?.points ?? 0,
        reportCount: 0,
        roadReports: 0,
        ecoReports: 0,
        messages: 0,
      });
  const canEdit = isMine && Date.now() - new Date(message.created_at).getTime() < EDIT_WINDOW_MS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={cn("group flex gap-2.5", isMine && "flex-row-reverse")}
    >
      <Avatar name={name} url={message.author?.avatar_url ?? null} bot={message.is_bot} />
      <div className={cn("max-w-[80%] min-w-0", isMine && "items-end")}>
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs text-muted-foreground mb-1",
            isMine && "justify-end",
          )}
        >
          <span className="font-medium text-foreground">{name}</span>
          {badges.map((b) => (
            <span key={b.label} title={b.label}>
              {b.emoji}
            </span>
          ))}
          <span>{timeLabel(message.created_at)}</span>
          {message.edited_at && <span>· edited</span>}
        </div>

        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm shadow-card",
            message.hidden
              ? "border border-destructive/40 bg-destructive/10"
              : message.is_bot
                ? "border border-primary/25 bg-primary/5"
                : isMine
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border",
          )}
        >
          {message.hidden ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" /> Removed by moderation
              </div>
              <p className="text-xs text-muted-foreground">{message.moderation_reason}</p>
            </div>
          ) : editing ? (
            <div className="space-y-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
              />
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  className="rounded-lg bg-background px-2 py-1 font-semibold text-foreground"
                  onClick={() => {
                    onEdit(draft.trim());
                    setEditing(false);
                  }}
                >
                  Save
                </button>
                <button type="button" onClick={() => setEditing(false)} className="px-2 py-1">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.body && <Markdownish text={message.body} />}
              {message.imageUrl && (
                <div className="mt-2 space-y-1">
                  <img
                    src={message.imageUrl}
                    alt="Shared by a neighbour"
                    className="max-h-72 w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                  {message.ai_image_warning && (
                    <div className="flex items-start gap-1.5 rounded-lg bg-amber-500/15 px-2 py-1.5 text-[11px] text-foreground">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      AI-generated or edited image detected. Verify before relying on this content.
                    </div>
                  )}
                </div>
              )}
              {message.report && <SharedReportCard report={message.report} />}
              {message.poll && <PollBlock poll={message.poll} onVote={onVote} />}
            </>
          )}
        </div>

        {!!message.reactions.length && (
          <div className={cn("mt-1 flex flex-wrap gap-1", isMine && "justify-end")}>
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => onReact(r.emoji, !r.mine)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs",
                  r.mine ? "border-primary bg-primary/10" : "border-border bg-card",
                )}
              >
                {r.emoji} {r.count}
              </button>
            ))}
          </div>
        )}

        <div
          className={cn(
            "mt-1 flex items-center gap-2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100",
            isMine && "justify-end",
          )}
        >
          <button type="button" title="React" onClick={() => setPicker((p) => !p)}>
            <Smile className="h-3.5 w-3.5" />
          </button>
          <button type="button" title="Reply" onClick={onReply}>
            <Reply className="h-3.5 w-3.5" />
          </button>
          {canEdit && !message.hidden && (
            <button type="button" title="Edit" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {isMine && (
            <button type="button" title="Delete" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {!isMine && !message.is_bot && (
            <>
              <button type="button" title="Report message" onClick={onReport}>
                <Flag className="h-3.5 w-3.5" />
              </button>
              <button type="button" title="Mute neighbour" onClick={onMute}>
                <VolumeX className="h-3.5 w-3.5" />
              </button>
              <button type="button" title="Block neighbour" onClick={onBlock}>
                <Ban className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {isMine && (
            <span title={`Read by ${message.readBy}`} className="ms-1">
              {message.readBy > 0 ? (
                <CheckCheck className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
          )}
        </div>

        {picker && (
          <div className={cn("mt-1 flex gap-1", isMine && "justify-end")}>
            {REACTION_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className="rounded-full border border-border bg-card px-2 py-0.5 text-sm hover:border-primary"
                onClick={() => {
                  onReact(e, !message.reactions.find((r) => r.emoji === e)?.mine);
                  setPicker(false);
                }}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
