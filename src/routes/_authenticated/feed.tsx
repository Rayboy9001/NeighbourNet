import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CATEGORIES, fetchReports, type ReportCategory, type ReportWithMeta } from "@/lib/reports";
import { ReportCard } from "@/components/ReportCard";
import { ReportCardSkeleton } from "@/components/Skeleton";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { StringKey } from "@/lib/i18n/strings";


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
  const { t } = useI18n();

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
        <h1 className="text-2xl md:text-3xl font-bold">{t("feed.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("feed.subtitle")}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        <FilterChip
          active={category === "all"}
          onClick={() => setCategory("all")}
          label={t("feed.all")}
        />
        {CATEGORIES.map((c) => (
          <FilterChip
            key={c.value}
            active={category === c.value}
            onClick={() => setCategory(c.value)}
            label={`${c.emoji} ${t(`category.${c.value}` as StringKey)}`}
          />
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <ReportCardSkeleton key={i} />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
          <div className="text-4xl mb-2">📍</div>
          <h3 className="font-semibold text-lg">{t("feed.empty")}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t("feed.emptyBody")}</p>
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
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      className={cn(
        "shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-card"
          : "bg-card text-foreground border-border hover:bg-accent hover:border-primary/25",
      )}
    >
      {label}
    </motion.button>
  );
}
