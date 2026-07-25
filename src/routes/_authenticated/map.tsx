import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { fetchReports, STATUS_META, type ReportWithMeta } from "@/lib/reports";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "Map · NeighbourNet" },
      { name: "description", content: "See reports pinned on the map." },
    ],
  }),
  component: MapPage,
});

const DOT: Record<"success" | "warning" | "danger", string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

function MapPage() {
  const [reports, setReports] = useState<ReportWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports().then((r) => {
      setReports(r);
      setLoading(false);
    });
  }, []);

  const withCoords = reports.filter(
    (r) => typeof r.latitude === "number" && typeof r.longitude === "number",
  );

  // Compute bounds for the pseudo-map
  const lats = withCoords.map((r) => r.latitude!);
  const lngs = withCoords.map((r) => r.longitude!);
  const minLat = lats.length ? Math.min(...lats) : 0;
  const maxLat = lats.length ? Math.max(...lats) : 1;
  const minLng = lngs.length ? Math.min(...lngs) : 0;
  const maxLng = lngs.length ? Math.max(...lngs) : 1;
  const pad = 0.02;

  function pos(lat: number, lng: number) {
    const x = ((lng - minLng + pad) / (maxLng - minLng + pad * 2)) * 100;
    const y = 100 - ((lat - minLat + pad) / (maxLat - minLat + pad * 2)) * 100;
    return { left: `${x}%`, top: `${y}%` };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Map</h1>
        <p className="mt-1 text-muted-foreground">
          Every marker is a report your community shared.
        </p>
      </div>

      <div className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-2xl border border-border overflow-hidden bg-[radial-gradient(ellipse_at_top,theme(colors.primary/10),transparent_50%),linear-gradient(180deg,oklch(0.97_0.02_240),oklch(0.94_0.04_150))]">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {loading && (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm">
            Loading map…
          </div>
        )}
        {!loading && withCoords.length === 0 && (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm px-6 text-center">
            No reports with a location yet. Add one from the Report tab.
          </div>
        )}
        {withCoords.map((r) => {
          const tone = STATUS_META[r.status].tone;
          const p = pos(r.latitude!, r.longitude!);
          return (
            <Link
              key={r.id}
              to="/reports/$id"
              params={{ id: r.id }}
              style={p}
              className="absolute -translate-x-1/2 -translate-y-full group"
            >
              <div
                className={cn(
                  "h-6 w-6 rounded-full ring-4 ring-background shadow-lift",
                  DOT[tone],
                )}
              />
              <div className="absolute left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap px-2 py-1 rounded-md bg-card border border-border text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow-card">
                {r.title}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <Legend color="danger" label="Unresolved" />
        <Legend color="warning" label="Being handled" />
        <Legend color="success" label="Fixed" />
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">All pinned reports</h2>
        <div className="space-y-2">
          {withCoords.map((r) => (
            <Link
              key={r.id}
              to="/reports/$id"
              params={{ id: r.id }}
              className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-accent transition"
            >
              <div
                className={cn(
                  "h-3 w-3 rounded-full shrink-0",
                  DOT[STATUS_META[r.status].tone],
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {r.address ?? `${r.latitude!.toFixed(4)}, ${r.longitude!.toFixed(4)}`}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Legend({
  color,
  label,
}: {
  color: "success" | "warning" | "danger";
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full", DOT[color])} /> {label}
    </span>
  );
}
