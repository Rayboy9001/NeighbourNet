import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { Flame, Trophy } from "lucide-react";
import { getLeaderboard } from "@/lib/challenge.functions";
import type { LeaderboardRow } from "@/lib/challenge.server";
import { cn } from "@/lib/utils";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "all", label: "All-Time" },
] as const;

type Range = (typeof RANGES)[number]["key"];

export function Leaderboard({ currentUserId }: { currentUserId?: string | null }) {
  const [range, setRange] = useState<Range>("today");
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const fetchBoard = useServerFn(getLeaderboard);

  useEffect(() => {
    let active = true;
    setRows(null);
    fetchBoard({ data: { range } })
      .then((r) => {
        if (active) setRows(r);
      })
      .catch(() => active && setRows([]));
    return () => {
      active = false;
    };
  }, [range, fetchBoard]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <motion.button
            key={r.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => setRange(r.key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors",
              range === r.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-accent",
            )}
          >
            {r.label}
          </motion.button>
        ))}
      </div>

      {rows === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl skeleton" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Trophy className="mx-auto mb-2 h-6 w-6 opacity-50" />
          No scores yet — be the first neighbour on the board.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row, i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <motion.li
                key={row.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3",
                  row.userId === currentUserId
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card",
                )}
              >
                <span className="w-7 text-center text-sm font-semibold tabular-nums">
                  {medal ?? i + 1}
                </span>
                <div className="h-9 w-9 rounded-full bg-accent grid place-items-center overflow-hidden text-sm font-semibold text-accent-foreground">
                  {row.avatarUrl ? (
                    <img src={row.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    row.name[0]?.toUpperCase() ?? "N"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{row.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {row.challenges} challenge{row.challenges === 1 ? "" : "s"}
                    {row.streak > 0 && (
                      <span className="ms-2 inline-flex items-center gap-0.5">
                        <Flame className="h-3 w-3" />
                        {row.streak}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums">{row.score}</span>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
