import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, MapPin, MessageCircle, ThumbsUp, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchReport,
  STATUS_META,
  STATUS_STEPS,
  timeAgo,
  toggleConfirm,
  type ReportStatus,
  type ReportWithMeta,
} from "@/lib/reports";
import { CategoryChip, StatusBadge } from "@/components/ReportCard";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { TranslatedText } from "@/components/TranslatedText";
import { detectLanguage } from "@/lib/i18n/translate";
import type { StringKey } from "@/lib/i18n/strings";

export const Route = createFileRoute("/_authenticated/reports/$id")({
  head: () => ({
    meta: [
      { title: "Report · NeighbourNet" },
      { name: "description", content: "Report details, comments and progress." },
    ],
  }),
  component: ReportDetail,
});

interface CommentRow {
  id: string;
  user_id: string;
  message: string;
  original_language: string | null;
  created_at: string;
  author_name: string;
}

function ReportDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState<ReportWithMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const { t, lang } = useI18n();

  async function load() {
    const r = await fetchReport(id);
    setReport(r);
    setLoading(false);
    const { data: cs } = await supabase
      .from("comments")
      .select("id,user_id,message,original_language,created_at")
      .eq("report_id", id)
      .order("created_at", { ascending: true });
    const userIds = Array.from(new Set((cs ?? []).map((c) => c.user_id)));
    const { data: profs } = userIds.length
      ? await supabase.from("profiles").select("id,name").in("id", userIds)
      : { data: [] };
    const nameOf = new Map((profs ?? []).map((p) => [p.id, p.name]));
    setComments(
      (cs ?? []).map((c) => ({
        ...c,
        author_name: nameOf.get(c.user_id) ?? "Neighbour",
      })),
    );
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleConfirm() {
    if (!report) return;
    const next = !report.confirmed_by_me;
    setReport({
      ...report,
      confirmed_by_me: next,
      confirm_count: report.confirm_count + (next ? 1 : -1),
    });
    try {
      await toggleConfirm(report.id, report.confirmed_by_me);
    } catch {
      load();
    }
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setPosting(true);
    const message = text.trim();
    const detected = (await detectLanguage(message)) ?? lang;
    const { error } = await supabase.from("comments").insert({
      report_id: id,
      user_id: user.id,
      message,
      original_language: detected,
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    setText("");
    load();
  }

  async function updateStatus(next: ReportStatus) {
    if (!report) return;
    const { error } = await supabase.from("reports").update({ status: next }).eq("id", report.id);
    if (error) return toast.error(error.message);
    setReport({ ...report, status: next });
    toast.success(t("detail.statusUpdated"));
  }

  async function deleteReport() {
    if (!report) return;
    if (!confirm(t("detail.deleteConfirm"))) return;
    const { error } = await supabase.from("reports").delete().eq("id", report.id);
    if (error) return toast.error(error.message);
    toast.success(t("detail.deleted"));
    navigate({ to: "/feed" });
  }

  if (loading) {
    return <div className="h-64 bg-muted animate-pulse rounded-2xl" />;
  }
  if (!report) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{t("detail.notFound")}</p>
        <Link to="/feed" className="text-primary underline mt-4 inline-block">
          {t("detail.backToFeed")}
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === report.user_id;
  const activeStep = STATUS_META[report.status].step;

  return (
    <div className="space-y-6">
      <button
        onClick={() => history.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </button>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
        {report.image_display_url && (
          <img
            src={report.image_display_url}
            alt=""
            className="w-full aspect-[16/10] object-cover"
          />
        )}
        <div className="p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryChip category={report.category} />
            <StatusBadge status={report.status} />
            <span className="ml-auto text-xs text-muted-foreground">
              {timeAgo(report.created_at)} · {t("common.by")} {report.author_name}
            </span>
          </div>
          <TranslatedText
            as="h1"
            text={report.title}
            sourceLang={report.original_language}
            className="text-2xl font-bold"
          />
          {report.description && (
            <TranslatedText
              text={report.description}
              sourceLang={report.original_language}
              className="text-muted-foreground whitespace-pre-wrap"
            />
          )}
          {(report.address || report.latitude) && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {report.address ?? `${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}`}
            </div>
          )}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleConfirm}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors",
                report.confirmed_by_me
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-accent",
              )}
            >
              <ThumbsUp className="h-4 w-4" />
              {report.confirmed_by_me ? t("detail.confirmed") : t("detail.confirm")} ·{" "}
              {report.confirm_count}
            </button>
            {isOwner && (
              <button
                onClick={deleteReport}
                className="ml-auto p-2 text-muted-foreground hover:text-danger rounded-full hover:bg-accent"
                aria-label="Delete report"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress tracker */}
      <section className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-semibold mb-4">{t("detail.progress")}</h2>
        <ol className="space-y-3">
          {STATUS_STEPS.map((s, idx) => {
            const step = idx + 1;
            const done = step <= activeStep;
            const current = step === activeStep;
            return (
              <li key={s} className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full grid place-items-center text-xs font-bold shrink-0",
                    done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    current && "ring-4 ring-primary/20",
                  )}
                >
                  {step}
                </div>
                <div className="flex-1">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      done ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {t(`status.${s}` as StringKey)}
                  </div>
                </div>
                {isOwner && !current && (
                  <button
                    onClick={() => updateStatus(s)}
                    className="text-xs text-primary hover:underline"
                  >
                    {t("detail.set")}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Comments */}
      <section className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">
            {t("detail.discussion")} ({comments.length})
          </h2>
        </div>
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground grid place-items-center text-sm font-semibold shrink-0">
                {c.author_name[0]?.toUpperCase() ?? "N"}
              </div>
              <div className="flex-1">
                <div className="text-sm">
                  <span className="font-medium">{c.author_name}</span>{" "}
                  <span className="text-xs text-muted-foreground">· {timeAgo(c.created_at)}</span>
                </div>
                <TranslatedText
                  text={c.message}
                  sourceLang={c.original_language}
                  className="text-sm text-foreground mt-0.5 whitespace-pre-wrap"
                  compact
                />
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("detail.firstComment")}
            </p>
          )}
        </div>
        <form onSubmit={postComment} className="mt-4 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder={t("detail.commentPlaceholder")}
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={posting || !text.trim()}
            className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {t("detail.post")}
          </button>
        </form>
      </section>
    </div>
  );
}
