import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  BASE_POINTS,
  COMPLETION_BONUS,
  PERFECT_BONUS,
  QUESTIONS_PER_CHALLENGE,
  isoWeekKey,
  speedBonus,
  todayKey,
  type QuizQuestion,
} from "./challenge";
import { generateQuestions } from "./challenge-questions.server";

type Admin = SupabaseClient<Database>;

async function admin(): Promise<Admin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as Admin;
}

export async function loadOrCreateDailyChallenge(dateKey: string) {
  const db = await admin();
  const existing = await db
    .from("challenges")
    .select("id,challenge_date,questions")
    .eq("challenge_date", dateKey)
    .maybeSingle();

  if (existing.data) {
    return {
      id: existing.data.id,
      challenge_date: existing.data.challenge_date,
      questions: existing.data.questions as unknown as QuizQuestion[],
    };
  }

  const questions = await generateQuestions(dateKey);
  const inserted = await db
    .from("challenges")
    .insert({ challenge_date: dateKey, questions: questions as never })
    .select("id,challenge_date,questions")
    .maybeSingle();

  if (inserted.data) {
    return {
      id: inserted.data.id,
      challenge_date: inserted.data.challenge_date,
      questions: inserted.data.questions as unknown as QuizQuestion[],
    };
  }

  // Someone else inserted it concurrently.
  const retry = await db
    .from("challenges")
    .select("id,challenge_date,questions")
    .eq("challenge_date", dateKey)
    .maybeSingle();
  if (!retry.data) throw new Error("Could not load today's challenge");
  return {
    id: retry.data.id,
    challenge_date: retry.data.challenge_date,
    questions: retry.data.questions as unknown as QuizQuestion[],
  };
}

export type SubmittedAnswer = {
  selected: number | null;
  remainingMs: number;
};

export type AttemptSummary = {
  score: number;
  correctCount: number;
  totalQuestions: number;
  avgTimeMs: number;
  pointsEarned: number;
  perfect: boolean;
  currentStreak: number;
  longestStreak: number;
  streakSavers: number;
  newAchievements: string[];
  alreadyCompleted: boolean;
  completedAt: string;
};

function daysBetween(a: string, b: string) {
  const d1 = new Date(a + "T00:00:00Z").getTime();
  const d2 = new Date(b + "T00:00:00Z").getTime();
  return Math.round((d2 - d1) / 86400000);
}

function categoryAllCorrect(
  questions: QuizQuestion[],
  answers: SubmittedAnswer[],
  categories: string[],
  min: number,
) {
  const idx = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => categories.includes(q.category));
  if (idx.length < min) return false;
  return idx.every(({ q, i }) => answers[i]?.selected === q.correctIndex);
}

export async function scoreAndSaveAttempt(
  userId: string,
  challengeId: string,
  answers: SubmittedAnswer[],
): Promise<AttemptSummary> {
  const db = await admin();

  const challenge = await db
    .from("challenges")
    .select("id,challenge_date,questions")
    .eq("id", challengeId)
    .maybeSingle();
  if (!challenge.data) throw new Error("Challenge not found");

  const questions = challenge.data.questions as unknown as QuizQuestion[];
  const dateKey = challenge.data.challenge_date;

  const existing = await db
    .from("challenge_attempts")
    .select("id,score,correct_count,avg_time_ms,points_earned")
    .eq("user_id", userId)
    .eq("challenge_id", challengeId)
    .maybeSingle();

  const streakRow = await db
    .from("challenge_streaks")
    .select("current_streak,longest_streak,streak_savers,last_played_date")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.data) {
    return {
      score: existing.data.score,
      correctCount: existing.data.correct_count,
      totalQuestions: questions.length,
      avgTimeMs: existing.data.avg_time_ms,
      pointsEarned: existing.data.points_earned,
      perfect: existing.data.correct_count === questions.length,
      currentStreak: streakRow.data?.current_streak ?? 0,
      longestStreak: streakRow.data?.longest_streak ?? 0,
      streakSavers: streakRow.data?.streak_savers ?? 0,
      newAchievements: [],
      alreadyCompleted: true,
    };
  }

  let score = 0;
  let correctCount = 0;
  let totalTime = 0;
  const perQuestionMs = 25000;

  questions.forEach((q, i) => {
    const a = answers[i];
    const remaining = Math.max(0, Math.min(perQuestionMs, a?.remainingMs ?? 0));
    totalTime += perQuestionMs - remaining;
    if (a && a.selected === q.correctIndex) {
      correctCount += 1;
      score += BASE_POINTS + speedBonus(remaining);
    }
  });

  const perfect = correctCount === questions.length && questions.length > 0;
  const avgTimeMs = questions.length ? Math.round(totalTime / questions.length) : 0;
  const pointsEarned =
    Math.round(score / 10) + COMPLETION_BONUS + (perfect ? PERFECT_BONUS : 0);

  await db.from("challenge_attempts").insert({
    user_id: userId,
    challenge_id: challengeId,
    challenge_date: dateKey,
    score,
    correct_count: correctCount,
    total_questions: questions.length || QUESTIONS_PER_CHALLENGE,
    avg_time_ms: avgTimeMs,
    points_earned: pointsEarned,
  });

  // ---- streak ----
  let current = 1;
  let longest = Math.max(1, streakRow.data?.longest_streak ?? 0);
  let savers = streakRow.data?.streak_savers ?? 0;
  const last = streakRow.data?.last_played_date ?? null;

  if (last) {
    const gap = daysBetween(last, dateKey);
    if (gap === 0) current = streakRow.data?.current_streak ?? 1;
    else if (gap === 1) current = (streakRow.data?.current_streak ?? 0) + 1;
    else if (gap === 2 && savers > 0) {
      current = (streakRow.data?.current_streak ?? 0) + 1;
      savers -= 1;
    } else current = 1;
  }
  longest = Math.max(longest, current);
  if (current > 0 && current % 7 === 0) savers += 1;

  await db.from("challenge_streaks").upsert(
    {
      user_id: userId,
      current_streak: current,
      longest_streak: longest,
      streak_savers: savers,
      last_played_date: dateKey,
    },
    { onConflict: "user_id" },
  );

  // ---- achievements ----
  const candidates: string[] = ["first_challenge"];
  if (perfect) candidates.push("quiz_master");
  if (score >= 200) candidates.push("community_genius");
  if (current >= 10) candidates.push("home_hero");
  if (categoryAllCorrect(questions, answers, ["electrical"], 1)) candidates.push("safety_champion");
  if (categoryAllCorrect(questions, answers, ["fire"], 1)) candidates.push("fire_ready");
  if (categoryAllCorrect(questions, answers, ["home"], 1)) candidates.push("diy_expert");
  if (categoryAllCorrect(questions, answers, ["water", "plumbing"], 2)) candidates.push("water_saver");
  if (categoryAllCorrect(questions, answers, ["environment", "recycling"], 2))
    candidates.push("eco_neighbour");

  const owned = await db
    .from("challenge_achievements")
    .select("code")
    .eq("user_id", userId);
  const ownedSet = new Set((owned.data ?? []).map((r) => r.code));
  const newAchievements = candidates.filter((c) => !ownedSet.has(c));
  if (newAchievements.length) {
    await db
      .from("challenge_achievements")
      .insert(newAchievements.map((code) => ({ user_id: userId, code })));
  }

  // ---- community points ----
  const profile = await db.from("profiles").select("points").eq("id", userId).maybeSingle();
  await db
    .from("profiles")
    .update({ points: (profile.data?.points ?? 0) + pointsEarned })
    .eq("id", userId);

  await awardWeeklyPodium();

  return {
    score,
    correctCount,
    totalQuestions: questions.length,
    avgTimeMs,
    pointsEarned,
    perfect,
    currentStreak: current,
    longestStreak: longest,
    streakSavers: savers,
    newAchievements,
    alreadyCompleted: false,
  };
}

/** Idempotently gives last week's top three their podium badge + bonus points. */
export async function awardWeeklyPodium() {
  const db = await admin();
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - day);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const from = todayKey(lastMonday);
  const to = todayKey(thisMonday);
  const weekKey = isoWeekKey(lastMonday);

  const rows = await db
    .from("challenge_attempts")
    .select("user_id,score")
    .gte("challenge_date", from)
    .lt("challenge_date", to);
  if (!rows.data?.length) return;

  const totals = new Map<string, number>();
  for (const r of rows.data) totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + r.score);
  const podium = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const prizes = [100, 50, 25];

  for (let i = 0; i < podium.length; i++) {
    const [userId] = podium[i];
    const code = `weekly_${i + 1}_${weekKey}`;
    const inserted = await db
      .from("challenge_achievements")
      .insert({ user_id: userId, code })
      .select("id");
    if (inserted.error || !inserted.data?.length) continue;
    const p = await db.from("profiles").select("points").eq("id", userId).maybeSingle();
    await db
      .from("profiles")
      .update({ points: (p.data?.points ?? 0) + prizes[i] })
      .eq("id", userId);
  }
}

export type LeaderboardRow = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  score: number;
  challenges: number;
  streak: number;
};

export async function loadLeaderboard(range: "today" | "week" | "month" | "all") {
  const db = await admin();
  let query = db.from("challenge_attempts").select("user_id,score");

  const now = new Date();
  if (range === "today") {
    query = query.eq("challenge_date", todayKey(now));
  } else if (range === "week") {
    const d = new Date(now);
    d.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    query = query.gte("challenge_date", todayKey(d));
  } else if (range === "month") {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    query = query.gte("challenge_date", todayKey(d));
  }

  const rows = await query;
  if (!rows.data?.length) return [] as LeaderboardRow[];

  const totals = new Map<string, { score: number; challenges: number }>();
  for (const r of rows.data) {
    const cur = totals.get(r.user_id) ?? { score: 0, challenges: 0 };
    cur.score += r.score;
    cur.challenges += 1;
    totals.set(r.user_id, cur);
  }

  const ids = [...totals.keys()];
  const [profiles, streaks] = await Promise.all([
    db.from("profiles").select("id,name,avatar_url").in("id", ids),
    db.from("challenge_streaks").select("user_id,current_streak").in("user_id", ids),
  ]);
  const nameById = new Map((profiles.data ?? []).map((p) => [p.id, p]));
  const streakById = new Map((streaks.data ?? []).map((s) => [s.user_id, s.current_streak]));

  return ids
    .map<LeaderboardRow>((id) => ({
      userId: id,
      name: nameById.get(id)?.name || "Neighbour",
      avatarUrl: nameById.get(id)?.avatar_url ?? null,
      score: totals.get(id)!.score,
      challenges: totals.get(id)!.challenges,
      streak: streakById.get(id) ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
}
