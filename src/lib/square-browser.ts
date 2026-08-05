import { supabase } from "@/integrations/supabase/client";
import type { Square, SquareMember, SquareMessage, SquareThread } from "./square";

export type MessageAuthor = { id: string; name: string; avatar_url: string | null; points: number };

export type ReportPreview = {
  id: string;
  title: string;
  category: string;
  status: string;
  imageUrl: string | null;
};

export type PollView = {
  id: string;
  question: string;
  options: string[];
  closes_at: string;
  counts: number[];
  myVote: number | null;
  total: number;
};

export type EnrichedMessage = SquareMessage & {
  author: MessageAuthor | null;
  imageUrl: string | null;
  reactions: { emoji: string; count: number; mine: boolean }[];
  poll: PollView | null;
  report: ReportPreview | null;
  readBy: number;
};

async function signed(path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from("reports-images").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function fetchSquares() {
  const { data } = await supabase
    .from("squares")
    .select("id,name,slug,emoji,description,area_label,is_public,max_participants")
    .order("name");
  return (data ?? []) as Square[];
}

export async function fetchMyMemberships(userId: string) {
  const { data } = await supabase
    .from("square_members")
    .select(
      "id,square_id,user_id,warnings,restricted_until,suspended,quiet_hours_enabled,quiet_hours_start,quiet_hours_end,last_seen_at",
    )
    .eq("user_id", userId);
  return (data ?? []) as SquareMember[];
}

export async function fetchMemberCounts(squareIds: string[]) {
  if (!squareIds.length) return new Map<string, number>();
  const { data } = await supabase
    .from("square_members")
    .select("square_id")
    .in("square_id", squareIds);
  const map = new Map<string, number>();
  for (const row of data ?? []) map.set(row.square_id, (map.get(row.square_id) ?? 0) + 1);
  return map;
}

export async function fetchThreads(squareId: string) {
  const { data } = await supabase
    .from("square_threads")
    .select("id,square_id,title,emoji,slug,sort_order")
    .eq("square_id", squareId)
    .order("sort_order")
    .order("title");
  return (data ?? []) as SquareThread[];
}

export async function fetchBlockedIds(userId: string) {
  const { data } = await supabase
    .from("square_blocks")
    .select("blocked_user_id,kind")
    .eq("user_id", userId);
  return {
    blocked: new Set((data ?? []).filter((b) => b.kind === "block").map((b) => b.blocked_user_id)),
    muted: new Set((data ?? []).filter((b) => b.kind === "mute").map((b) => b.blocked_user_id)),
  };
}

export async function fetchThreadMessages(threadId: string, viewerId: string) {
  const { data } = await supabase
    .from("square_messages")
    .select(
      "id,square_id,thread_id,user_id,is_bot,body,image_path,ai_image_warning,report_id,reply_to_id,mentions,hidden,moderation_reason,edited_at,created_at",
    )
    .eq("thread_id", threadId)
    .is("deleted_at", null)
    .order("created_at")
    .limit(200);

  const rows = (data ?? []) as SquareMessage[];
  if (!rows.length) return [] as EnrichedMessage[];

  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];
  const messageIds = rows.map((r) => r.id);
  const reportIds = [...new Set(rows.map((r) => r.report_id).filter(Boolean))] as string[];

  const [profilesRes, reactionsRes, pollsRes, reportsRes, readsRes] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id,name,avatar_url,points").in("id", userIds)
      : Promise.resolve({ data: [] as MessageAuthor[] }),
    supabase.from("square_reactions").select("message_id,user_id,emoji").in("message_id", messageIds),
    supabase
      .from("square_polls")
      .select("id,message_id,question,options,closes_at")
      .in("message_id", messageIds),
    reportIds.length
      ? supabase.from("reports").select("id,title,category,status,image_url").in("id", reportIds)
      : Promise.resolve({ data: [] as { id: string; title: string; category: string; status: string; image_url: string | null }[] }),
    supabase.from("square_reads").select("user_id,last_read_at").eq("thread_id", threadId),
  ]);

  const authors = new Map((profilesRes.data ?? []).map((p) => [p.id, p as MessageAuthor]));

  const reactionsByMessage = new Map<string, Map<string, { count: number; mine: boolean }>>();
  for (const r of reactionsRes.data ?? []) {
    const per = reactionsByMessage.get(r.message_id) ?? new Map();
    const cur = per.get(r.emoji) ?? { count: 0, mine: false };
    cur.count += 1;
    if (r.user_id === viewerId) cur.mine = true;
    per.set(r.emoji, cur);
    reactionsByMessage.set(r.message_id, per);
  }

  const polls = pollsRes.data ?? [];
  const votesRes = polls.length
    ? await supabase
        .from("square_poll_votes")
        .select("poll_id,user_id,option_index")
        .in(
          "poll_id",
          polls.map((p) => p.id),
        )
    : { data: [] as { poll_id: string; user_id: string; option_index: number }[] };

  const pollByMessage = new Map<string, PollView>();
  for (const p of polls) {
    const votes = (votesRes.data ?? []).filter((v) => v.poll_id === p.id);
    const counts = (p.options as string[]).map(
      (_, i) => votes.filter((v) => v.option_index === i).length,
    );
    pollByMessage.set(p.message_id, {
      id: p.id,
      question: p.question,
      options: p.options as string[],
      closes_at: p.closes_at,
      counts,
      total: votes.length,
      myVote: votes.find((v) => v.user_id === viewerId)?.option_index ?? null,
    });
  }

  const reportMap = new Map<string, ReportPreview>();
  for (const r of reportsRes.data ?? []) {
    reportMap.set(r.id, {
      id: r.id,
      title: r.title,
      category: r.category,
      status: r.status,
      imageUrl: await signed(r.image_url),
    });
  }

  const reads = readsRes.data ?? [];

  return Promise.all(
    rows.map(async (m) => ({
      ...m,
      author: m.user_id ? (authors.get(m.user_id) ?? null) : null,
      imageUrl: await signed(m.image_path),
      reactions: [...(reactionsByMessage.get(m.id) ?? new Map()).entries()].map(([emoji, v]) => ({
        emoji,
        count: v.count,
        mine: v.mine,
      })),
      poll: pollByMessage.get(m.id) ?? null,
      report: m.report_id ? (reportMap.get(m.report_id) ?? null) : null,
      readBy: reads.filter(
        (r) => r.user_id !== m.user_id && new Date(r.last_read_at) >= new Date(m.created_at),
      ).length,
    })),
  );
}

export async function toggleReaction(messageId: string, userId: string, emoji: string, on: boolean) {
  if (on) {
    await supabase.from("square_reactions").insert({ message_id: messageId, user_id: userId, emoji });
  } else {
    await supabase
      .from("square_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("emoji", emoji);
  }
}

export async function votePoll(pollId: string, userId: string, optionIndex: number) {
  await supabase
    .from("square_poll_votes")
    .upsert({ poll_id: pollId, user_id: userId, option_index: optionIndex }, { onConflict: "poll_id,user_id" });
}

export async function editMessage(messageId: string, body: string) {
  await supabase
    .from("square_messages")
    .update({ body, edited_at: new Date().toISOString() })
    .eq("id", messageId);
}

export async function deleteMessage(messageId: string) {
  await supabase
    .from("square_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId);
}

export async function reportMessage(messageId: string, reporterId: string, reason: string) {
  await supabase
    .from("square_message_reports")
    .upsert({ message_id: messageId, reporter_id: reporterId, reason }, { onConflict: "message_id,reporter_id" });
}

export async function setBlock(userId: string, targetId: string, kind: "block" | "mute") {
  await supabase
    .from("square_blocks")
    .upsert({ user_id: userId, blocked_user_id: targetId, kind }, { onConflict: "user_id,blocked_user_id" });
}

export async function clearBlock(userId: string, targetId: string) {
  await supabase.from("square_blocks").delete().eq("user_id", userId).eq("blocked_user_id", targetId);
}

export async function markRead(threadId: string, userId: string) {
  await supabase
    .from("square_reads")
    .upsert({ thread_id: threadId, user_id: userId, last_read_at: new Date().toISOString() }, { onConflict: "thread_id,user_id" });
}

export async function leaveSquare(userId: string, squareId: string) {
  await supabase.from("square_members").delete().eq("user_id", userId).eq("square_id", squareId);
}

export async function createThread(input: {
  squareId: string;
  userId: string;
  title: string;
  emoji: string;
}) {
  const slug =
    input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || `topic-${Date.now()}`;
  const { data, error } = await supabase
    .from("square_threads")
    .insert({
      square_id: input.squareId,
      created_by: input.userId,
      title: input.title.slice(0, 60),
      emoji: input.emoji,
      slug,
      sort_order: 200,
    })
    .select("id,square_id,title,emoji,slug,sort_order")
    .single();
  if (error) throw error;
  return data as SquareThread;
}

export async function uploadSquareImage(file: File, userId: string) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/square/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("reports-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return path;
}
