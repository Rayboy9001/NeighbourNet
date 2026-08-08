import { Link } from "@tanstack/react-router";
import { MessageCircle, ThumbsUp, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import type { ReportWithMeta } from "@/lib/reports";
import { CATEGORIES, STATUS_META, timeAgo, toggleConfirm } from "@/lib/reports";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { TranslatedText } from "@/components/TranslatedText";
import type { StringKey } from "@/lib/i18n/strings";

const TONE: Record<"success" | "warning" | "danger", string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  danger: "bg-danger/15 text-danger",
};

export function StatusBadge({ status }: { status: ReportWithMeta["status"] }) {
  const meta = STATUS_META[status];
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        TONE[meta.tone],
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          meta.tone === "success" && "bg-success",
          meta.tone === "warning" && "bg-warning",
          meta.tone === "danger" && "bg-danger",
        )}
      />
      {t(`status.${status}` as StringKey)}
    </span>
  );
}

export function CategoryChip({ category }: { category: ReportWithMeta["category"] }) {
  const c = CATEGORIES.find((x) => x.value === category);
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent text-accent-foreground text-xs font-medium">
      <span>{c?.emoji}</span>
      {t(`category.${category}` as StringKey)}
    </span>
  );
}

export function ReportCard({ report }: { report: ReportWithMeta }) {
  const [confirmed, setConfirmed] = useState(report.confirmed_by_me);
  const [count, setCount] = useState(report.confirm_count);
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();

  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const next = !confirmed;
    setConfirmed(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      await toggleConfirm(report.id, confirmed);
    } catch {
      setConfirmed(!next);
      setCount((c) => c + (next ? -1 : 1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="rounded-2xl"
    >
      <Link
        to="/reports/$id"
        params={{ id: report.id }}
        className="group block bg-card rounded-2xl border border-border shadow-card hover:shadow-lift hover:border-primary/25 transition-all duration-300 overflow-hidden"
      >
        {report.image_display_url && (
          <div className="aspect-[16/10] w-full bg-muted overflow-hidden">
            <img
              src={report.image_display_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          </div>
        )}
        <div className="p-4 md:p-5 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryChip category={report.category} />
            <StatusBadge status={report.status} />
            <span className="text-xs text-muted-foreground ml-auto">
              {timeAgo(report.created_at)}
            </span>
          </div>
          <div>
            <TranslatedText
              as="h3"
              text={report.title}
              sourceLang={report.original_language}
              className="font-semibold text-base md:text-lg leading-snug"
              compact
              hideControls
            />
            {report.description && (
              <TranslatedText
                text={report.description}
                sourceLang={report.original_language}
                className="mt-1 text-sm text-muted-foreground line-clamp-2"
                compact
                hideControls
              />
            )}
          </div>
          {report.address && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {report.address}
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleConfirm}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border press active:scale-95 transition-all",
                confirmed
                  ? "bg-primary text-primary-foreground border-primary shadow-card"
                  : "bg-background text-foreground border-border hover:bg-accent hover:border-primary/30",
              )}
            >
              <ThumbsUp className={cn("h-4 w-4 transition-transform", confirmed && "scale-110")} />
              {t("detail.confirm")} · {count}
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              {report.comment_count}
            </div>
            <div className="ml-auto text-xs text-muted-foreground">
              {t("common.by")} {report.author_name}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
