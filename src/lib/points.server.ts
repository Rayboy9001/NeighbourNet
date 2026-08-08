import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Admin = SupabaseClient<Database>;

async function admin(): Promise<Admin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as Admin;
}

export type AwardResult = { balance: number; awarded: boolean };

/**
 * THE single way to change a neighbour's Community Points.
 *
 * Never update `profiles.community_points` directly anywhere else — this helper
 * writes the balance and the matching `point_transactions` row atomically and
 * refuses to award the same `sourceKey` twice (duplicate-reward protection).
 */
export async function awardPoints(
  userId: string,
  amount: number,
  reason: string,
  sourceKey?: string | null,
): Promise<AwardResult> {
  const db = await admin();
  const { data, error } = await db.rpc("award_points", {
    _user_id: userId,
    _amount: Math.trunc(amount),
    _reason: reason,
    _source_key: sourceKey ?? undefined,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return { balance: row?.balance ?? 0, awarded: Boolean(row?.awarded) };
}

export async function getPointsBalance(userId: string): Promise<number> {
  const db = await admin();
  const { data } = await db
    .from("profiles")
    .select("community_points")
    .eq("id", userId)
    .maybeSingle();
  return data?.community_points ?? 0;
}

export type PointTransaction = {
  id: string;
  amount: number;
  reason: string;
  balance_after: number;
  created_at: string;
};

export async function getPointHistory(userId: string, limit = 25) {
  const db = await admin();
  const { data, error } = await db
    .from("point_transactions")
    .select("id,amount,reason,balance_after,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as PointTransaction[];
}

export type PointsDebugRow = {
  userId: string;
  name: string;
  balance: number;
  updatedAt: string;
  transactionCount: number;
  lastTransaction: PointTransaction | null;
  history: PointTransaction[];
};

/** Admin debugging snapshot: DB balance + full recent history per neighbour. */
export async function loadPointsDebug(search?: string): Promise<PointsDebugRow[]> {
  const db = await admin();
  let q = db
    .from("profiles")
    .select("id,name,community_points,updated_at")
    .order("community_points", { ascending: false })
    .limit(25);
  if (search?.trim()) q = q.ilike("name", `%${search.trim()}%`);
  const { data: profiles, error } = await q;
  if (error) throw new Error(error.message);

  const rows: PointsDebugRow[] = [];
  for (const p of profiles ?? []) {
    const history = await getPointHistory(p.id, 10);
    const { count } = await db
      .from("point_transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", p.id);
    rows.push({
      userId: p.id,
      name: p.name,
      balance: p.community_points ?? 0,
      updatedAt: p.updated_at,
      transactionCount: count ?? 0,
      lastTransaction: history[0] ?? null,
      history,
    });
  }
  return rows;
}
