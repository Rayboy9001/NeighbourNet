import { createHmac, timingSafeEqual } from "node:crypto";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Index of the current 7-day window since the unix epoch. */
export function currentWeekIndex(now: Date = new Date()): number {
  return Math.floor(now.getTime() / WEEK_MS);
}

/** Deterministic 6-digit admin code for a given week window. */
export function adminCodeForWeek(weekIndex: number): string {
  const seed = process.env["ADMIN_CODE_SEED"];
  if (!seed) throw new Error("ADMIN_CODE_SEED is not configured");
  const digest = createHmac("sha256", seed).update(`admin-code:${weekIndex}`).digest();
  const n = digest.readUInt32BE(0) % 1_000_000;
  return String(n).padStart(6, "0");
}

export function currentAdminCode(now: Date = new Date()) {
  const week = currentWeekIndex(now);
  return {
    code: adminCodeForWeek(week),
    validFrom: new Date(week * WEEK_MS),
    validUntil: new Date((week + 1) * WEEK_MS),
  };
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * Accepts the current week's rotating code. The previous week's code stays
 * valid for a short grace period so a code that arrives near the rollover
 * still works.
 */
export function verifyAdminCode(input: string, now: Date = new Date()): boolean {
  const trimmed = input.trim();
  const week = currentWeekIndex(now);
  if (safeEqual(trimmed, adminCodeForWeek(week))) return true;
  const intoWeek = now.getTime() - week * WEEK_MS;
  if (intoWeek < 60 * 60 * 1000 && safeEqual(trimmed, adminCodeForWeek(week - 1))) return true;
  return false;
}
