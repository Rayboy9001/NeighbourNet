/** Client-safe types, constants and helpers for Neighbourhood Square. */

export type Square = {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  description: string;
  area_label: string;
  is_public: boolean;
  max_participants: number;
};

export type SquareThread = {
  id: string;
  square_id: string;
  title: string;
  emoji: string;
  slug: string;
  sort_order: number;
};

export type SquareMessage = {
  id: string;
  square_id: string;
  thread_id: string;
  user_id: string | null;
  is_bot: boolean;
  body: string;
  image_path: string | null;
  ai_image_warning: boolean;
  report_id: string | null;
  reply_to_id: string | null;
  mentions: string[];
  hidden: boolean;
  moderation_reason: string | null;
  edited_at: string | null;
  created_at: string;
};

export type SquareMember = {
  id: string;
  square_id: string;
  user_id: string;
  warnings: number;
  restricted_until: string | null;
  suspended: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: number;
  quiet_hours_end: number;
  last_seen_at: string;
};

export const MAX_MESSAGE_LENGTH = 1000;
export const EDIT_WINDOW_MS = 15 * 60 * 1000;
export const REACTION_EMOJIS = ["👍", "❤️", "🙏", "😮", "😂", "🚧"];
export const BOT_NAME = "NeighbourBot";

export const NEW_THREAD_EMOJIS = ["💬", "🚧", "💧", "🌳", "🐶", "☕", "💡", "🚨", "♻️", "🏡"];

/** Plain text + images only — no links, code, or file-ish content. */
const LINK_RE = /(https?:\/\/|www\.)\S+/i;
const BARE_DOMAIN_RE = /\b[a-z0-9-]+\.(com|net|org|io|co|ru|xyz|info|biz|shop|link|tz|ke|ug)\b/i;
const CODE_RE = /```|<\/?[a-z][\s\S]*>|(\bfunction\b|\bconst\b|\bimport\b)\s*[\w{(=]/i;
const FILE_RE = /\.(zip|rar|7z|exe|msi|apk|dmg|bat|sh|pdf|docx?|xlsx?|pptx?|mp4|mov|avi|mkv)\b/i;

export type ContentIssue = { ok: boolean; reason?: string };

export function checkContentPolicy(text: string): ContentIssue {
  const t = text.trim();
  if (!t) return { ok: true };
  if (t.length > MAX_MESSAGE_LENGTH)
    return { ok: false, reason: `Messages are limited to ${MAX_MESSAGE_LENGTH} characters.` };
  if (LINK_RE.test(t) || BARE_DOMAIN_RE.test(t))
    return { ok: false, reason: "External website links aren't allowed in the Square." };
  if (CODE_RE.test(t))
    return { ok: false, reason: "Code snippets aren't allowed — plain text and photos only." };
  if (FILE_RE.test(t))
    return { ok: false, reason: "Only photos can be shared — documents, videos and archives aren't allowed." };
  return { ok: true };
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function checkImageFile(file: File): ContentIssue {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type))
    return { ok: false, reason: "Only JPG, PNG, WEBP or GIF photos can be shared." };
  if (file.size > MAX_IMAGE_BYTES)
    return { ok: false, reason: "Photos must be smaller than 8 MB." };
  return { ok: true };
}

export function extractMentions(text: string): string[] {
  return [...text.matchAll(/@([a-z0-9_.-]{2,32})/gi)].map((m) => m[1].toLowerCase());
}

export function mentionsBot(text: string): boolean {
  return /@neighbourbot\b/i.test(text);
}

// ---- reputation badges ----

export type ReputationBadge = { emoji: string; label: string };

export function reputationBadges(input: {
  points: number;
  reportCount: number;
  roadReports: number;
  ecoReports: number;
  messages: number;
}): ReputationBadge[] {
  const badges: ReputationBadge[] = [];
  if (input.points >= 100) badges.push({ emoji: "🛡", label: "Trusted Member" });
  if (input.messages >= 25) badges.push({ emoji: "🏅", label: "Helpful Neighbour" });
  if (input.roadReports >= 3) badges.push({ emoji: "🚧", label: "Road Reporter" });
  if (input.ecoReports >= 3) badges.push({ emoji: "🌳", label: "Eco Champion" });
  if (input.reportCount >= 10) badges.push({ emoji: "💡", label: "Local Expert" });
  return badges.slice(0, 2);
}

export function isQuietHour(member: Pick<SquareMember, "quiet_hours_enabled" | "quiet_hours_start" | "quiet_hours_end">, now = new Date()) {
  if (!member.quiet_hours_enabled) return false;
  const h = now.getHours();
  const { quiet_hours_start: s, quiet_hours_end: e } = member;
  return s <= e ? h >= s && h < e : h >= s || h < e;
}

export function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  if (same(d, yest)) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
}

export function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
