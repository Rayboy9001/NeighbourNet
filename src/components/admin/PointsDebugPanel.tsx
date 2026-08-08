import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bug, RefreshCw } from "lucide-react";
import { getPointsDebug } from "@/lib/points.functions";
import type { PointsDebugRow } from "@/lib/points.server";
import { formatPoints } from "@/hooks/use-points";

/** Admin-only Community Points debugging panel. */
export function PointsDebugPanel() {
  const load = useServerFn(getPointsDebug);
  const [rows, setRows] = useState<PointsDebugRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setRows(await load({ data: { search: search.trim() || undefined } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load point data");
      setRows([]);
    }
  }, [load, search]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Bug className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Community Points debugger</h2>
        <button
          onClick={() => void refresh()}
          className="ms-auto flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void refresh()}
          placeholder="Search by neighbour name"
          className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {rows === null && <div className="h-20 rounded-xl skeleton" />}
      {rows?.length === 0 && (
        <p className="text-sm text-muted-foreground">No neighbours found.</p>
      )}

      <div className="space-y-3">
        {(rows ?? []).map((row) => (
          <details key={row.userId} className="rounded-xl border border-border p-3">
            <summary className="cursor-pointer text-sm font-medium flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{row.name}</span>
              <span className="tabular-nums">🏆 {formatPoints(row.balance)}</span>
              <span className="text-xs text-muted-foreground">
                {row.transactionCount} transaction{row.transactionCount === 1 ? "" : "s"}
              </span>
            </summary>
            <dl className="mt-3 grid gap-1 text-xs text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">User ID:</span>{" "}
                <code className="break-all">{row.userId}</code>
              </div>
              <div>
                <span className="font-medium text-foreground">DB balance:</span>{" "}
                {formatPoints(row.balance)}
              </div>
              <div>
                <span className="font-medium text-foreground">Last update:</span>{" "}
                {new Date(row.updatedAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium text-foreground">Last transaction:</span>{" "}
                {row.lastTransaction
                  ? `${row.lastTransaction.amount >= 0 ? "+" : ""}${row.lastTransaction.amount} · ${row.lastTransaction.reason} → ${row.lastTransaction.balance_after}`
                  : "none"}
              </div>
            </dl>
            {row.history.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs">
                {row.history.map((t) => (
                  <li key={t.id} className="flex items-center gap-2">
                    <span
                      className={
                        t.amount >= 0
                          ? "tabular-nums font-medium text-success"
                          : "tabular-nums font-medium text-danger"
                      }
                    >
                      {t.amount >= 0 ? "+" : ""}
                      {t.amount}
                    </span>
                    <span className="flex-1 truncate">{t.reason}</span>
                    <span className="tabular-nums text-muted-foreground">
                      → {t.balance_after}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(t.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </details>
        ))}
      </div>
    </section>
  );
}
