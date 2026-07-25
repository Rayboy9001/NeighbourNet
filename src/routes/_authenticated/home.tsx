import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, MapPin, ClipboardList, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { fetchReports, type ReportWithMeta } from "@/lib/reports";
import { ReportCard } from "@/components/ReportCard";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home · NeighbourNet" },
      { name: "description", content: "Your neighbourhood at a glance." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const [reports, setReports] = useState<ReportWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [myCount, setMyCount] = useState<number>(0);

  useEffect(() => {
    fetchReports({ limit: 5 }).then((r) => {
      setReports(r);
      setLoading(false);
    });
    if (user) {
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .then(({ count }) => setMyCount(count ?? 0));
    }
  }, [user]);

  const greet = new Date().getHours();
  const greeting =
    greet < 12 ? "Good morning" : greet < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          {greeting}, {profile?.name || "neighbour"} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Help improve your neighbourhood today.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/report"
          className="group col-span-2 md:col-span-1 bg-primary text-primary-foreground p-5 rounded-2xl shadow-lift hover:opacity-95 transition"
        >
          <Plus className="h-6 w-6 mb-3" />
          <div className="font-semibold">Report an issue</div>
          <div className="text-sm opacity-80 mt-1">
            Snap a photo and pin the location.
          </div>
        </Link>
        <Link
          to="/map"
          className="bg-card border border-border p-5 rounded-2xl hover:shadow-card transition"
        >
          <MapPin className="h-6 w-6 mb-3 text-primary" />
          <div className="font-semibold">Nearby</div>
          <div className="text-sm text-muted-foreground mt-1">View the map</div>
        </Link>
        <Link
          to="/profile"
          className="bg-card border border-border p-5 rounded-2xl hover:shadow-card transition"
        >
          <ClipboardList className="h-6 w-6 mb-3 text-primary" />
          <div className="font-semibold">My reports</div>
          <div className="text-sm text-muted-foreground mt-1">
            {myCount} submitted
          </div>
        </Link>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Trending nearby</h2>
          </div>
          <Link to="/feed" className="text-sm text-primary font-medium hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
      <div className="text-4xl mb-2">🌱</div>
      <h3 className="font-semibold">Be the first to report</h3>
      <p className="text-sm text-muted-foreground mt-1">
        No reports yet in your area. Start the conversation.
      </p>
      <Link
        to="/report"
        className="inline-block mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
      >
        Report an issue
      </Link>
    </div>
  );
}
