import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Shared formatting so every surface renders points identically. */
export function formatPoints(value: number | null | undefined) {
  return new Intl.NumberFormat().format(Math.max(0, Math.trunc(value ?? 0)));
}

/**
 * Single source of truth for a neighbour's Community Points.
 * Always reads `profiles.community_points` from the database and stays in sync
 * through a Realtime subscription — no local storage, no derived maths.
 */
export function usePoints(userId: string | null | undefined) {
  const [points, setPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("profiles")
      .select("community_points")
      .eq("id", userId)
      .maybeSingle();
    setPoints(data?.community_points ?? 0);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setPoints(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh();

    const channel = supabase
      .channel(`points:${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload) => {
          const next = (payload.new as { community_points?: number } | null)?.community_points;
          if (typeof next === "number") setPoints(next);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "point_transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const next = (payload.new as { balance_after?: number } | null)?.balance_after;
          if (typeof next === "number") setPoints(next);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  return { points: points ?? 0, loading, refresh };
}
