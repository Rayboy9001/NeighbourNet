import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield, Trash2, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { fetchReports, timeAgo, type ReportWithMeta } from "@/lib/reports";
import { CategoryChip, StatusBadge } from "@/components/ReportCard";
import { claimAdmin, deleteReportAsAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin · NeighbourNet" },
      { name: "description", content: "Moderate and remove community reports." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const { isAdmin, loading, setIsAdmin } = useIsAdmin(user?.id);
  const [code, setCode] = useState("");
  const [claiming, setClaiming] = useState(false);
  const claim = useServerFn(claimAdmin);
  const del = useServerFn(deleteReportAsAdmin);

  const [reports, setReports] = useState<ReportWithMeta[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  async function loadReports() {
    setReportsLoading(true);
    try {
      setReports(await fetchReports());
    } finally {
      setReportsLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) loadReports();
  }, [isAdmin]);

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setClaiming(true);
    try {
      const res = await claim({ data: { code: code.trim() } });
      if (res.ok) {
        toast.success("Admin rights granted");
        setIsAdmin(true);
        setCode("");
      } else {
        toast.error("Incorrect admin code");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setClaiming(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await del({ data: { reportId: id } });
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success("Report deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) {
    return <div className="h-32 bg-muted animate-pulse rounded-2xl" />;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 text-primary grid place-items-center mb-3">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Admin access</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enter the admin code to unlock moderation tools.
          </p>
        </div>
        <form
          onSubmit={handleClaim}
          className="bg-card border border-border rounded-2xl p-5 space-y-3"
        >
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Admin code"
            autoComplete="off"
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={claiming || !code.trim()}
            className="w-full rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {claiming ? "Verifying…" : "Unlock admin"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-muted-foreground">
            Remove any report from the community feed.
          </p>
        </div>
      </header>

      <section className="bg-card border border-border rounded-2xl divide-y divide-border">
        {reportsLoading && (
          <div className="p-6 text-sm text-muted-foreground">Loading reports…</div>
        )}
        {!reportsLoading && reports.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground text-center">
            No reports to moderate.
          </div>
        )}
        {reports.map((r) => (
          <div key={r.id} className="p-4 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <CategoryChip category={r.category} />
                <StatusBadge status={r.status} />
                <span className="text-xs text-muted-foreground">
                  {timeAgo(r.created_at)} · by {r.author_name}
                </span>
              </div>
              <div className="font-medium truncate">{r.title}</div>
              {r.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                  {r.description}
                </p>
              )}
            </div>
            <button
              onClick={() => handleDelete(r.id, r.title)}
              className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-danger hover:bg-danger/10"
              aria-label={`Delete ${r.title}`}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
