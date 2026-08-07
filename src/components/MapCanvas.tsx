import { Link } from "@tanstack/react-router";
import { STATUS_META, type ReportWithMeta } from "@/lib/reports";
import { cn } from "@/lib/utils";

export const DOT: Record<"success" | "warning" | "danger", string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function MapCanvasSkeleton() {
  return (
    <div className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-2xl border border-border overflow-hidden bg-muted/40">
      <div className="absolute inset-0 shimmer" />
      <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
        Loading map…
      </div>
    </div>
  );
}

export default function MapCanvas({ reports }: { reports: ReportWithMeta[] }) {
  const lats = reports.map((r) => r.latitude!);
  const lngs = reports.map((r) => r.longitude!);
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
    <div className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-2xl border border-border overflow-hidden bg-[radial-gradient(ellipse_at_top,theme(colors.primary/10),transparent_50%),linear-gradient(180deg,oklch(0.97_0.02_240),oklch(0.94_0.04_150))]">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {reports.length === 0 && (
        <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm px-6 text-center">
          No reports with a location yet. Add one from the Report tab.
        </div>
      )}
      {reports.map((r) => {
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
  );
}
