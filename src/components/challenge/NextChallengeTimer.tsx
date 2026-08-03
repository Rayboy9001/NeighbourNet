import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

const DAY_MS = 24 * 60 * 60 * 1000;

function format(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Counts down the 24 hours from when the neighbour completed today's challenge. */
export function NextChallengeTimer({ completedAt }: { completedAt: string | null }) {
  const target = completedAt ? new Date(completedAt).getTime() + DAY_MS : null;
  const [remaining, setRemaining] = useState(() => (target ? target - Date.now() : 0));

  useEffect(() => {
    if (!target) return;
    setRemaining(target - Date.now());
    const id = window.setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (!target) return null;

  const unlocked = remaining <= 0;
  const progress = Math.min(1, Math.max(0, 1 - remaining / DAY_MS));

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 text-center space-y-2">
      <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        {unlocked ? "A new challenge is ready" : "Next challenge unlocks in"}
      </div>
      {!unlocked && (
        <div className="text-3xl font-bold tabular-nums tracking-tight">{format(remaining)}</div>
      )}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: "tween", duration: 0.4 }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {unlocked
          ? "Refresh to play the newest set of questions."
          : "Every neighbour gets one challenge per 24 hours — keep the streak going."}
      </p>
    </div>
  );
}
