import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { Flame, Trophy, Sparkles, Target, Clock, Award, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { QuizRunner, type Answer } from "@/components/challenge/QuizRunner";
import { Leaderboard } from "@/components/challenge/Leaderboard";
import { NextChallengeTimer } from "@/components/challenge/NextChallengeTimer";
import { Confetti } from "@/components/challenge/Confetti";
import { getDailyChallenge, submitChallengeAttempt } from "@/lib/challenge.functions";
import type { AttemptSummary } from "@/lib/challenge.server";
import {
  ACHIEVEMENTS,
  MAX_SCORE,
  QUESTIONS_PER_CHALLENGE,
  QUESTION_SECONDS,
  achievementMeta,
  streakLabel,
  todayKey,
  type DailyChallenge,
} from "@/lib/challenge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/challenge")({
  head: () => ({
    meta: [
      { title: "Community Challenge — NeighbourNet" },
      {
        name: "description",
        content:
          "Take today's 15-question NeighbourNet quiz on home maintenance, safety and community know-how. Build a streak, earn badges and climb the neighbourhood leaderboard.",
      },
      { property: "og:title", content: "Community Challenge — NeighbourNet" },
      {
        property: "og:description",
        content: "Learn practical neighbourhood skills with a fun daily quiz. Earn points, badges and streaks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChallengePage,
});

type Tab = "today" | "leaderboard" | "achievements";

type Stats = {
  streak: number;
  longest: number;
  savers: number;
  played: number;
  bestScore: number;
  badges: string[];
  todayDone: AttemptSummary | null;
};

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Flame;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 24 }}
      className="rounded-2xl border border-border bg-card p-4 shadow-card"
    >
      <Icon className="h-4 w-4 text-primary mb-2" />
      <div className="text-xl font-bold leading-none tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      {hint && <div className="text-[11px] text-muted-foreground/80 mt-0.5">{hint}</div>}
    </motion.div>
  );
}

function ChallengePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("today");
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [summary, setSummary] = useState<AttemptSummary | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadChallenge = useServerFn(getDailyChallenge);
  const submit = useServerFn(submitChallengeAttempt);
  const dateKey = useMemo(() => todayKey(), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadChallenge({ data: { dateKey } })
      .then((c) => active && setChallenge(c as DailyChallenge))
      .catch(() => active && setError("Today's challenge could not be loaded. Please try again."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [dateKey, loadChallenge]);

  const refreshStats = useCallback(async () => {
    if (!user?.id) return;
    const [attempts, streak, badges] = await Promise.all([
      supabase
        .from("challenge_attempts")
        .select(
          "score,correct_count,total_questions,avg_time_ms,points_earned,challenge_date,completed_at",
        )
        .eq("user_id", user.id),
      supabase
        .from("challenge_streaks")
        .select("current_streak,longest_streak,streak_savers")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("challenge_achievements").select("code").eq("user_id", user.id),
    ]);

    const rows = attempts.data ?? [];
    // Locked out for 24 hours from the moment the last challenge was completed.
    const recent = [...rows]
      .sort((a, b) => (a.completed_at < b.completed_at ? 1 : -1))
      .find(
        (r) =>
          r.challenge_date === dateKey ||
          Date.now() - new Date(r.completed_at).getTime() < 24 * 60 * 60 * 1000,
      );
    setStats({
      streak: streak.data?.current_streak ?? 0,
      longest: streak.data?.longest_streak ?? 0,
      savers: streak.data?.streak_savers ?? 0,
      played: rows.length,
      bestScore: rows.reduce((m, r) => Math.max(m, r.score), 0),
      badges: (badges.data ?? []).map((b) => b.code),
      todayDone: recent
        ? {
            score: recent.score,
            correctCount: recent.correct_count,
            totalQuestions: recent.total_questions,
            avgTimeMs: recent.avg_time_ms,
            pointsEarned: recent.points_earned,
            perfect: recent.correct_count === recent.total_questions,
            currentStreak: streak.data?.current_streak ?? 0,
            longestStreak: streak.data?.longest_streak ?? 0,
            streakSavers: streak.data?.streak_savers ?? 0,
            newAchievements: [],
            alreadyCompleted: true,
            completedAt: recent.completed_at,
          }
        : null,
    });
  }, [user?.id, dateKey]);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  const handleFinish = useCallback(
    async (answers: Answer[]) => {
      if (!challenge) return;
      setPlaying(false);
      try {
        const result = await submit({ data: { challengeId: challenge.id, answers } });
        setSummary(result);
      } catch {
        setError("We couldn't save your score. Check your connection and try again.");
      }
      void refreshStats();
    },
    [challenge, submit, refreshStats],
  );

  const done = summary ?? stats?.todayDone ?? null;

  return (
    <div className="space-y-6">
      {summary && !summary.alreadyCompleted && summary.correctCount >= 8 && <Confetti />}

      <header className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Daily learning
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Community Challenge</h1>
        <p className="text-sm text-muted-foreground">
          {QUESTIONS_PER_CHALLENGE} questions · {QUESTION_SECONDS}s each · up to {MAX_SCORE} points
          today
        </p>
      </header>

      {!playing && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Flame}
            label="Current streak"
            value={stats?.streak ?? 0}
            hint={streakLabel(stats?.streak ?? 0)}
          />
          <StatCard icon={Trophy} label="Best score" value={stats?.bestScore ?? 0} />
          <StatCard icon={Target} label="Challenges played" value={stats?.played ?? 0} />
          <StatCard
            icon={Award}
            label="Badges earned"
            value={stats?.badges.length ?? 0}
            hint={stats?.savers ? `${stats.savers} streak saver(s)` : undefined}
          />
        </div>
      )}

      {!playing && (
        <div className="flex gap-2 border-b border-border">
          {(
            [
              ["today", "Today"],
              ["leaderboard", "Leaderboard"],
              ["achievements", "Achievements"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "relative px-3 py-2 text-sm font-medium transition-colors",
                tab === key ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              {tab === key && (
                <motion.span
                  layoutId="challenge-tab"
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {playing && challenge ? (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <QuizRunner questions={challenge.questions} onFinish={handleFinish} />
          </motion.div>
        ) : tab === "today" ? (
          <motion.div
            key="today"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="h-48 rounded-2xl skeleton" />
            ) : done ? (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
                <div className="text-center">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Today's result
                  </div>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="text-5xl font-bold tabular-nums mt-1"
                  >
                    {done.score}
                  </motion.div>
                  <div className="text-sm text-muted-foreground">out of {MAX_SCORE} points</div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-semibold tabular-nums">
                      {done.correctCount}/{done.totalQuestions}
                    </div>
                    <div className="text-xs text-muted-foreground">Correct</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold tabular-nums">
                      {Math.round((done.correctCount / Math.max(1, done.totalQuestions)) * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Accuracy</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold tabular-nums inline-flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {(done.avgTimeMs / 1000).toFixed(1)}s
                    </div>
                    <div className="text-xs text-muted-foreground">Avg time</div>
                  </div>
                </div>
                <div className="rounded-xl bg-muted/60 p-3 text-center text-sm">
                  <span className="font-semibold">+{done.pointsEarned}</span> community points
                  earned{done.perfect && " · Perfect score bonus 🎉"}
                </div>
                {summary?.newAchievements?.length ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    {summary.newAchievements.map((code) => {
                      const meta = achievementMeta(code);
                      return (
                        <motion.span
                          key={code}
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium"
                        >
                          {meta.emoji} {meta.label}
                        </motion.span>
                      );
                    })}
                  </div>
                ) : null}
                <NextChallengeTimer completedAt={done.completedAt ?? null} />
                <p className="text-center text-sm text-muted-foreground">
                  Come back tomorrow for a fresh set of questions — keep your streak alive 🔥
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card text-center space-y-4">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 grid place-items-center text-2xl">
                  🧠
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Today's challenge is ready</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fresh questions on home maintenance, safety, recycling and neighbourhood
                    know-how. Answer fast for speed bonuses.
                  </p>
                </div>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 500, damping: 24 }}
                  onClick={() => {
                    setError(null);
                    setPlaying(true);
                  }}
                  disabled={!challenge}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lift disabled:opacity-50"
                >
                  <Play className="h-4 w-4" /> Start challenge
                </motion.button>
                <div className="text-xs text-muted-foreground">
                  +10 per correct answer · up to +5 speed bonus · +50 perfect · +20 for completing
                </div>
              </div>
            )}
          </motion.div>
        ) : tab === "leaderboard" ? (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Leaderboard currentUserId={user?.id} />
          </motion.div>
        ) : (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
          >
            {ACHIEVEMENTS.map((a) => {
              const earned = stats?.badges.includes(a.code);
              return (
                <motion.div
                  key={a.code}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  className={cn(
                    "rounded-2xl border p-4 text-center",
                    earned
                      ? "border-primary/40 bg-primary/5 shadow-card"
                      : "border-dashed border-border opacity-60",
                  )}
                >
                  <div className="text-2xl mb-1">{a.emoji}</div>
                  <div className="text-sm font-semibold">{a.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{a.description}</div>
                </motion.div>
              );
            })}
            {(stats?.badges ?? [])
              .filter((c) => c.startsWith("weekly_"))
              .map((code) => {
                const meta = achievementMeta(code);
                return (
                  <div
                    key={code}
                    className="rounded-2xl border border-primary/40 bg-primary/5 p-4 text-center shadow-card"
                  >
                    <div className="text-2xl mb-1">{meta.emoji}</div>
                    <div className="text-sm font-semibold">{meta.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{meta.description}</div>
                  </div>
                );
              })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
