import { supabase } from "@/integrations/supabase/client";

export type ReportCategory =
  | "roads"
  | "electricity"
  | "water"
  | "waste"
  | "environment"
  | "safety"
  | "animals"
  | "other";

export type ReportStatus =
  | "reported"
  | "verified"
  | "assigned"
  | "in_progress"
  | "resolved";

export const CATEGORIES: { value: ReportCategory; label: string; emoji: string }[] = [
  { value: "roads", label: "Roads", emoji: "🚧" },
  { value: "electricity", label: "Electricity", emoji: "💡" },
  { value: "water", label: "Water", emoji: "🚰" },
  { value: "waste", label: "Waste", emoji: "🗑" },
  { value: "environment", label: "Environment", emoji: "🌳" },
  { value: "safety", label: "Safety", emoji: "🚨" },
  { value: "animals", label: "Animals", emoji: "🐕" },
  { value: "other", label: "Other", emoji: "📌" },
];

export const STATUS_META: Record<
  ReportStatus,
  { label: string; tone: "danger" | "warning" | "success"; step: number }
> = {
  reported: { label: "Reported", tone: "danger", step: 1 },
  verified: { label: "Community Verified", tone: "warning", step: 2 },
  assigned: { label: "Assigned", tone: "warning", step: 3 },
  in_progress: { label: "In Progress", tone: "warning", step: 4 },
  resolved: { label: "Resolved", tone: "success", step: 5 },
};

export const STATUS_STEPS: ReportStatus[] = [
  "reported",
  "verified",
  "assigned",
  "in_progress",
  "resolved",
];

export interface ReportRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: ReportCategory;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  status: ReportStatus;
  original_language: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportWithMeta extends ReportRow {
  author_name: string;
  author_avatar: string | null;
  confirm_count: number;
  comment_count: number;
  confirmed_by_me: boolean;
  image_display_url: string | null;
}

export async function fetchReports(opts?: {
  category?: ReportCategory;
  status?: ReportStatus;
  userId?: string;
  limit?: number;
}) {
  let q = supabase
    .from("reports")
    .select(
      "id,user_id,title,description,category,image_url,latitude,longitude,address,status,original_language,created_at,updated_at",
    )
    .order("created_at", { ascending: false });

  if (opts?.category) q = q.eq("category", opts.category);
  if (opts?.status) q = q.eq("status", opts.status);
  if (opts?.userId) q = q.eq("user_id", opts.userId);
  if (opts?.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error) throw error;
  return await enrichReports((data ?? []) as ReportRow[]);
}

export async function fetchReport(id: string): Promise<ReportWithMeta | null> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [enriched] = await enrichReports([data as ReportRow]);
  return enriched;
}

async function enrichReports(rows: ReportRow[]): Promise<ReportWithMeta[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));

  const [profilesRes, confirmsRes, commentsRes, sessionRes] = await Promise.all([
    supabase.from("profiles").select("id,name,avatar_url").in("id", userIds),
    supabase.from("confirmations").select("report_id,user_id").in("report_id", ids),
    supabase.from("comments").select("report_id").in("report_id", ids),
    supabase.auth.getUser(),
  ]);

  const profiles = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p as { id: string; name: string; avatar_url: string | null }]),
  );
  const currentUserId = sessionRes.data.user?.id ?? null;

  const confirmMap = new Map<string, { count: number; mine: boolean }>();
  for (const c of confirmsRes.data ?? []) {
    const cur = confirmMap.get(c.report_id) ?? { count: 0, mine: false };
    cur.count += 1;
    if (c.user_id === currentUserId) cur.mine = true;
    confirmMap.set(c.report_id, cur);
  }

  const commentMap = new Map<string, number>();
  for (const c of commentsRes.data ?? []) {
    commentMap.set(c.report_id, (commentMap.get(c.report_id) ?? 0) + 1);
  }

  const withImages = await Promise.all(
    rows.map(async (r) => {
      let display: string | null = null;
      if (r.image_url) {
        const { data: signed } = await supabase.storage
          .from("reports-images")
          .createSignedUrl(r.image_url, 60 * 60);
        display = signed?.signedUrl ?? null;
      }
      const p = profiles.get(r.user_id);
      const conf = confirmMap.get(r.id) ?? { count: 0, mine: false };
      return {
        ...r,
        author_name: p?.name ?? "Neighbour",
        author_avatar: p?.avatar_url ?? null,
        confirm_count: conf.count,
        comment_count: commentMap.get(r.id) ?? 0,
        confirmed_by_me: conf.mine,
        image_display_url: display,
      } satisfies ReportWithMeta;
    }),
  );

  return withImages;
}

export async function toggleConfirm(reportId: string, currentlyConfirmed: boolean) {
  const { data: sess } = await supabase.auth.getUser();
  if (!sess.user) throw new Error("Not signed in");
  if (currentlyConfirmed) {
    await supabase
      .from("confirmations")
      .delete()
      .eq("report_id", reportId)
      .eq("user_id", sess.user.id);
  } else {
    await supabase
      .from("confirmations")
      .insert({ report_id: reportId, user_id: sess.user.id });
  }
}

export async function uploadReportImage(file: File): Promise<string> {
  const { data: sess } = await supabase.auth.getUser();
  if (!sess.user) throw new Error("Not signed in");
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${sess.user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("reports-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return path;
}

export async function createReport(input: {
  title: string;
  description: string;
  category: ReportCategory;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  original_language?: string | null;
}) {
  const { data: sess } = await supabase.auth.getUser();
  if (!sess.user) throw new Error("Not signed in");
  const { data, error } = await supabase
    .from("reports")
    .insert({ ...input, user_id: sess.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
