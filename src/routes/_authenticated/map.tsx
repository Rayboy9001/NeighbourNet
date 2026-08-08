import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { STATUS_META } from "@/lib/reports";
import { reportsQuery } from "@/lib/queries";
import { DOT, MapCanvasSkeleton } from "@/components/MapCanvas";
import { cn } from "@/lib/utils";

const MapCanvas = lazy(() => import("@/components/MapCanvas"));

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "Map · NeighbourNet" },
      { name: "description", content: "See reports pinned on the map." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { data: reports = [], isPending } = useQuery(reportsQuery());

  const withCoords = reports.filter(
    (r) => typeof r.latitude === "number" && typeof r.longitude === "number",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Map</h1>
        <p className="mt-1 text-muted-foreground">
          Every marker is a report your community shared.
        </p>
      </div>

      {isPending ? (
        <MapCanvasSkeleton />
      ) : (
        <Suspense fallback={<MapCanvasSkeleton />}>
          <MapCanvas reports={withCoords} />
        </Suspense>
      )}

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
                className={cn("h-3 w-3 rounded-full shrink-0", DOT[STATUS_META[r.status].tone])}
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

function Legend({ color, label }: { color: "success" | "warning" | "danger"; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full", DOT[color])} /> {label}
    </span>
  );
}
