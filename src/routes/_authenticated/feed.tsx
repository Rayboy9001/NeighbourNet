import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CATEGORIES, fetchReports, type ReportCategory, type ReportWithMeta } from "@/lib/reports";
import { ReportCard } from "@/components/ReportCard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({
    meta: [
      { title: "Community feed · NeighbourNet" },
      { name: "description", content: "Browse and confirm local reports." },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const [category, setCategory] = useState<ReportCategory | "all">("all");
  const [reports, setReports] = useState<ReportWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchReports(category === "all" ? {} : { category }).then((r) => {
      setReports(r);
      setLoading(false);
    });
  }, [category]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Community feed</h1>
        <p className="mt-1 text-muted-foreground">
          See what neighbours are reporting.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        <FilterChip
          active={category === "all"}
          onClick={() => setCategory("all")}
          label="All"
        />
        {CATEGORIES.map((c) => (
          <FilterChip
            key={c.value}
            active={category === c.value}
            onClick={() => setCategory(c.value)}
            label={`${c.emoji} ${c.label}`}
          />
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center text-muted-foreground">
          No reports in this category yet.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-foreground border-border hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}
