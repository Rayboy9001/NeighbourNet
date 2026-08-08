import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { timeAgo } from "@/lib/reports";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · NeighbourNet" },
      { name: "description", content: "Updates from your reports and community." },
    ],
  }),
  component: NotificationsPage,
});

interface Item {
  id: string;
  type: "confirm" | "comment";
  message: string;
  created_at: string;
  report_id: string;
  report_title: string;
}

function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: myReports } = await supabase
        .from("reports")
        .select("id,title")
        .eq("user_id", user.id);
      const ids = (myReports ?? []).map((r) => r.id);
      const map = new Map((myReports ?? []).map((r) => [r.id, r.title]));
      if (ids.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }
      const [confirms, comments] = await Promise.all([
        supabase
          .from("confirmations")
          .select("id,report_id,user_id,created_at")
          .in("report_id", ids)
          .neq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("comments")
          .select("id,report_id,user_id,message,created_at")
          .in("report_id", ids)
          .neq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);
      const userIds = Array.from(
        new Set([
          ...(confirms.data ?? []).map((c) => c.user_id),
          ...(comments.data ?? []).map((c) => c.user_id),
        ]),
      );
      const { data: profs } = userIds.length
        ? await supabase.from("profiles").select("id,name").in("id", userIds)
        : { data: [] };
      const nameOf = new Map((profs ?? []).map((p) => [p.id, p.name]));

      const merged: Item[] = [
        ...(confirms.data ?? []).map((c) => ({
          id: `c-${c.id}`,
          type: "confirm" as const,
          message: `${nameOf.get(c.user_id) ?? "A neighbour"} confirmed your report`,
          created_at: c.created_at,
          report_id: c.report_id,
          report_title: map.get(c.report_id) ?? "",
        })),
        ...(comments.data ?? []).map((c) => ({
          id: `m-${c.id}`,
          type: "comment" as const,
          message: `${nameOf.get(c.user_id) ?? "A neighbour"} commented: "${c.message.slice(0, 60)}"`,
          created_at: c.created_at,
          report_id: c.report_id,
          report_title: map.get(c.report_id) ?? "",
        })),
      ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      setItems(merged);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Notifications</h1>
        <p className="mt-1 text-muted-foreground">Activity on your reports.</p>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
          <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <div className="font-medium">You're all caught up</div>
          <p className="text-sm text-muted-foreground mt-1">
            When neighbours interact with your reports, you'll see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Link
              key={n.id}
              to="/reports/$id"
              params={{ id: n.report_id }}
              className="block p-4 bg-card border border-border rounded-xl hover:bg-accent"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm">{n.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">on “{n.report_title}”</div>
                </div>
                <div className="text-xs text-muted-foreground shrink-0">
                  {timeAgo(n.created_at)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
