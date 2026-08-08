export type QuizQuestion = {
  id: string;
  category: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  scenario?: boolean;
};

export type DailyChallenge = {
  id: string;
  challenge_date: string;
  questions: QuizQuestion[];
};

export const QUESTION_SECONDS = 25;
export const QUESTIONS_PER_CHALLENGE = 15;
export const BASE_POINTS = 10;
export const MAX_SPEED_BONUS = 5;
/** 15 x (10 base + 5 speed) */
export const MAX_SCORE = QUESTIONS_PER_CHALLENGE * (BASE_POINTS + MAX_SPEED_BONUS);
export const PERFECT_BONUS = 50;
export const COMPLETION_BONUS = 20;

export const CHALLENGE_CATEGORIES: { key: string; label: string; emoji: string }[] = [
  { key: "home", label: "Home Maintenance", emoji: "🏠" },
  { key: "plumbing", label: "Plumbing", emoji: "🚰" },
  { key: "electrical", label: "Electrical Safety", emoji: "⚡" },
  { key: "fire", label: "Fire Safety", emoji: "🧯" },
  { key: "gardening", label: "Gardening", emoji: "🌳" },
  { key: "road", label: "Road Safety", emoji: "🚧" },
  { key: "recycling", label: "Recycling", emoji: "♻️" },
  { key: "weather", label: "Weather Preparedness", emoji: "🌦" },
  { key: "health", label: "Health & Hygiene", emoji: "🦟" },
  { key: "pets", label: "Animals & Pets", emoji: "🐕" },
  { key: "water", label: "Water Conservation", emoji: "💧" },
  { key: "environment", label: "Environmental Awareness", emoji: "🌍" },
  { key: "etiquette", label: "Neighbourhood Etiquette", emoji: "🏡" },
  { key: "emergency", label: "Emergency Preparedness", emoji: "🚨" },
  { key: "general", label: "General Knowledge", emoji: "🧠" },
];

export function categoryMeta(key: string) {
  return (
    CHALLENGE_CATEGORIES.find((c) => c.key === key) ?? {
      key,
      label: "General Knowledge",
      emoji: "🧠",
    }
  );
}

export type AchievementDef = {
  code: string;
  emoji: string;
  label: string;
  description: string;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    code: "first_challenge",
    emoji: "🏅",
    label: "First Challenge",
    description: "Complete your first daily challenge",
  },
  {
    code: "diy_expert",
    emoji: "🛠",
    label: "DIY Expert",
    description: "Ace every home-maintenance question in a challenge",
  },
  {
    code: "safety_champion",
    emoji: "⚡",
    label: "Safety Champion",
    description: "Ace every electrical safety question in a challenge",
  },
  {
    code: "water_saver",
    emoji: "🚰",
    label: "Water Saver",
    description: "Ace all water & plumbing questions in a challenge",
  },
  {
    code: "fire_ready",
    emoji: "🧯",
    label: "Fire Ready",
    description: "Ace every fire safety question in a challenge",
  },
  { code: "home_hero", emoji: "🏡", label: "Home Hero", description: "Reach a 10-day streak" },
  {
    code: "eco_neighbour",
    emoji: "🌳",
    label: "Eco Neighbour",
    description: "Ace all eco questions in a challenge",
  },
  {
    code: "community_genius",
    emoji: "🧠",
    label: "Community Genius",
    description: "Score 200+ in a single challenge",
  },
  { code: "quiz_master", emoji: "👑", label: "Quiz Master", description: "Get a perfect 15 / 15" },
];

export function achievementMeta(code: string): AchievementDef {
  const found = ACHIEVEMENTS.find((a) => a.code === code);
  if (found) return found;
  const weekly = code.match(/^weekly_(\d)_/);
  if (weekly) {
    const place = Number(weekly[1]);
    const emoji = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";
    return {
      code,
      emoji,
      label: `Weekly #${place}`,
      description: "Finished on the weekly podium",
    };
  }
  return { code, emoji: "⭐", label: code, description: "" };
}

export function speedBonus(remainingMs: number) {
  const ratio = Math.max(0, Math.min(1, remainingMs / (QUESTION_SECONDS * 1000)));
  return Math.max(1, Math.ceil(ratio * MAX_SPEED_BONUS));
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

/** ISO week key like 2026-W31 */
export function isoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function streakLabel(streak: number) {
  if (streak >= 100) return "🔥 100-day legend";
  if (streak >= 50) return "🔥 50-day streak";
  if (streak >= 10) return "🔥 10-day streak";
  if (streak >= 3) return "🔥 3-day streak";
  if (streak > 0) return `🔥 ${streak}-day streak`;
  return "Start a streak today";
}
