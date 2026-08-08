import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { checkContentPolicy, extractMentions, mentionsBot } from "./square";

type Admin = SupabaseClient<Database>;

async function admin(): Promise<Admin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as Admin;
}

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "openai/gpt-5.6-sol";

type GwMessage = {
  role: "system" | "user" | "assistant";
  content: string | Array<Record<string, unknown>>;
};

async function callGateway(messages: GwMessage[]): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: MODEL, reasoning_effort: "none", messages }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Square AI gateway error", res.status, text);
    if (res.status === 429) throw new Error("The Square's AI helper is busy — try again shortly.");
    if (res.status === 402) throw new Error("AI credits are exhausted for this workspace.");
    throw new Error("The Square's AI helper is unavailable right now.");
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

function parseJson<T>(raw: string): T | null {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as T;
    } catch {
      return null;
    }
  }
}

// ---------------- moderation ----------------

const MODERATION_PROMPT = `You moderate a friendly neighbourhood community chat (NeighbourNet "Neighbourhood Square"). Residents discuss local issues: roads, water, power, safety, pets, events.

Decide if a message violates the community rules. Violation categories:
hate_speech, slur, harassment, personal_attack, threat, bullying, sexual_content, spam, scam, profanity, political_campaigning, religious_extremism, dangerous_misinformation, advertisement.

Be tolerant: frustration, criticism of authorities/services, strong opinions, and mild slang are ALLOWED. Only flag genuinely harmful content.

Reply with ONLY compact JSON:
{"allowed": true|false, "category": "<category or none>", "explanation": "<one friendly sentence for the author explaining what rule the message broke>"}`;

export type ModerationVerdict = {
  allowed: boolean;
  category: string;
  explanation: string;
};

export async function moderateText(text: string): Promise<ModerationVerdict> {
  if (!text.trim()) return { allowed: true, category: "none", explanation: "" };
  try {
    const raw = await callGateway([
      { role: "system", content: MODERATION_PROMPT },
      { role: "user", content: text.slice(0, 2000) },
    ]);
    const parsed = parseJson<ModerationVerdict>(raw);
    if (!parsed || typeof parsed.allowed !== "boolean")
      return { allowed: true, category: "none", explanation: "" };
    return {
      allowed: parsed.allowed,
      category: parsed.category ?? "none",
      explanation: parsed.explanation ?? "This message broke the Square's community rules.",
    };
  } catch (err) {
    console.error("moderateText failed", err);
    // Fail open so the Square keeps working when AI is unavailable.
    return { allowed: true, category: "none", explanation: "" };
  }
}

export async function detectAiImage(signedUrl: string): Promise<boolean> {
  try {
    const raw = await callGateway([
      {
        role: "system",
        content:
          'You inspect photos shared in a neighbourhood community chat. Judge whether the image looks AI-generated, synthetic, or heavily manipulated. Reply with ONLY JSON: {"ai_generated": true|false, "confidence": 0-1}. Be conservative: ordinary phone photos, low quality, blur or compression are NOT manipulation.',
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Is this image AI-generated or heavily edited?" },
          { type: "image_url", image_url: { url: signedUrl } },
        ],
      },
    ]);
    const parsed = parseJson<{ ai_generated?: boolean; confidence?: number }>(raw);
    return Boolean(parsed?.ai_generated) && (parsed?.confidence ?? 1) >= 0.6;
  } catch (err) {
    console.error("detectAiImage failed", err);
    return false;
  }
}

// ---------------- helpers ----------------

async function signedImageUrl(db: Admin, path: string) {
  const { data } = await db.storage.from("reports-images").createSignedUrl(path, 60 * 30);
  return data?.signedUrl ?? null;
}

async function threadContext(db: Admin, threadId: string, limit = 25) {
  const { data } = await db
    .from("square_messages")
    .select("body,is_bot,user_id,created_at,report_id")
    .eq("thread_id", threadId)
    .eq("hidden", false)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = (data ?? []).reverse();
  const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];
  const { data: profiles } = await db.from("profiles").select("id,name").in("id", ids);
  const names = new Map((profiles ?? []).map((p) => [p.id, p.name]));
  return rows
    .map(
      (r) =>
        `${r.is_bot ? "NeighbourBot" : (names.get(r.user_id ?? "") ?? "Neighbour")}: ${r.body}`,
    )
    .join("\n");
}

async function nearbyReportSummary(db: Admin) {
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data } = await db
    .from("reports")
    .select("id,title,category,status,created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(15);
  if (!data?.length) return "No reports have been filed in the last 7 days.";
  return data.map((r) => `- ${r.title} (${r.category}, status: ${r.status})`).join("\n");
}

const BOT_SYSTEM = `You are NeighbourBot, a friendly member of a NeighbourNet "Neighbourhood Square" — a local community chat.

Your job in the Square:
- Answer neighbours' questions about local issues, home maintenance and safety.
- Explain reports and what statuses mean (Reported = just submitted, Community Verified = confirmed by neighbours, Assigned = passed to a responder, In Progress = being worked on, Resolved = fixed).
- Give emergency and safety guidance; for electricity, gas or structural work always tell people to call a qualified professional or emergency services.
- Share practical safety tips, do calculations, translate messages, and clarify community rules (be kind, no links, photos and plain text only, no hate speech, harassment, scams or campaigning).

Style: warm, calm, concise (under 120 words), plain sentences, occasional simple markdown lists. Never invent local facts — if you don't know, say so. Never share links.`;

// ---------------- public server helpers ----------------

export type SendResult = {
  status: "sent" | "blocked" | "restricted";
  messageId?: string;
  reason?: string;
  warnings?: number;
  restrictedUntil?: string | null;
};

export async function sendMessage(input: {
  userId: string;
  squareId: string;
  threadId: string;
  body: string;
  imagePath?: string | null;
  reportId?: string | null;
  replyToId?: string | null;
}): Promise<SendResult> {
  const db = await admin();
  const body = input.body.trim();

  const { data: member } = await db
    .from("square_members")
    .select("id,warnings,restricted_until,suspended")
    .eq("square_id", input.squareId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!member) return { status: "blocked", reason: "Join this Square before posting." };
  if (member.suspended)
    return {
      status: "restricted",
      reason: "You're suspended from this Square after repeated rule breaches.",
    };
  if (member.restricted_until && new Date(member.restricted_until) > new Date())
    return {
      status: "restricted",
      reason: "You're temporarily restricted from chatting after repeated rule breaches.",
      restrictedUntil: member.restricted_until,
    };

  if (!body && !input.imagePath && !input.reportId)
    return { status: "blocked", reason: "Write something or attach a photo." };

  const policy = checkContentPolicy(body);
  if (!policy.ok) return { status: "blocked", reason: policy.reason };

  const verdict = await moderateText(body);

  const { data: inserted, error } = await db
    .from("square_messages")
    .insert({
      square_id: input.squareId,
      thread_id: input.threadId,
      user_id: input.userId,
      body,
      image_path: input.imagePath ?? null,
      report_id: input.reportId ?? null,
      reply_to_id: input.replyToId ?? null,
      mentions: extractMentions(body),
      hidden: !verdict.allowed,
      moderation_reason: verdict.allowed ? null : verdict.explanation,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (!verdict.allowed) {
    const warnings = member.warnings + 1;
    const suspended = warnings >= 5;
    const restrictedUntil =
      !suspended && warnings >= 3 ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null;
    await db
      .from("square_members")
      .update({ warnings, suspended, restricted_until: restrictedUntil })
      .eq("id", member.id);
    return {
      status: "blocked",
      messageId: inserted.id,
      reason: verdict.explanation,
      warnings,
      restrictedUntil,
    };
  }

  if (input.imagePath) {
    const url = await signedImageUrl(db, input.imagePath);
    if (url && (await detectAiImage(url))) {
      await db.from("square_messages").update({ ai_image_warning: true }).eq("id", inserted.id);
    }
  }

  if (mentionsBot(body) || (body.endsWith("?") && body.length > 12)) {
    await replyAsBot(input.squareId, input.threadId, body, inserted.id);
  }

  return { status: "sent", messageId: inserted.id };
}

export async function replyAsBot(
  squareId: string,
  threadId: string,
  question: string,
  replyToId: string | null,
) {
  const db = await admin();
  try {
    const [history, reports] = await Promise.all([
      threadContext(db, threadId),
      nearbyReportSummary(db),
    ]);
    const reply = await callGateway([
      { role: "system", content: BOT_SYSTEM },
      {
        role: "user",
        content: `Recent NeighbourNet reports (last 7 days):\n${reports}\n\nRecent conversation:\n${history}\n\nLatest message to answer:\n${question}`,
      },
    ]);
    if (!reply.trim()) return null;
    const { data } = await db
      .from("square_messages")
      .insert({
        square_id: squareId,
        thread_id: threadId,
        is_bot: true,
        body: reply.trim(),
        reply_to_id: replyToId,
      })
      .select("id")
      .single();
    return data?.id ?? null;
  } catch (err) {
    console.error("replyAsBot failed", err);
    return null;
  }
}

export async function summariseThread(squareId: string, threadId: string) {
  const db = await admin();
  const history = await threadContext(db, threadId, 80);
  if (!history.trim()) return null;
  const summary = await callGateway([
    { role: "system", content: BOT_SYSTEM },
    {
      role: "user",
      content: `Summarise this Square discussion for neighbours catching up. Start with the heading "**Today's Discussion Summary**" then 3-6 short bullet points of concrete updates, decisions and requests. No preamble.\n\n${history}`,
    },
  ]);
  if (!summary.trim()) return null;
  const { data } = await db
    .from("square_messages")
    .insert({ square_id: squareId, thread_id: threadId, is_bot: true, body: summary.trim() })
    .select("id")
    .single();
  return data?.id ?? null;
}

export async function createPoll(input: {
  userId: string;
  squareId: string;
  threadId: string;
  question: string;
  options: string[];
  hours: number;
}) {
  const db = await admin();
  const { data: message, error } = await db
    .from("square_messages")
    .insert({
      square_id: input.squareId,
      thread_id: input.threadId,
      user_id: input.userId,
      body: `📊 ${input.question}`,
    })
    .select("id")
    .single();
  if (error) throw error;
  const { error: pollError } = await db.from("square_polls").insert({
    message_id: message.id,
    question: input.question,
    options: input.options,
    created_by: input.userId,
    closes_at: new Date(Date.now() + input.hours * 3600000).toISOString(),
  });
  if (pollError) throw pollError;
  return message.id;
}

export async function joinSquare(userId: string, squareId: string) {
  const db = await admin();
  const { count } = await db
    .from("square_members")
    .select("id", { count: "exact", head: true })
    .eq("square_id", squareId);
  const { data: square } = await db
    .from("squares")
    .select("max_participants")
    .eq("id", squareId)
    .maybeSingle();
  const existing = await db
    .from("square_members")
    .select("id")
    .eq("square_id", squareId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing.data) return { ok: true as const };
  if ((count ?? 0) >= (square?.max_participants ?? 50))
    return { ok: false as const, reason: "This Square is full (50 neighbours). Try another one." };
  const { error } = await db
    .from("square_members")
    .insert({ square_id: squareId, user_id: userId });
  if (error) throw error;
  return { ok: true as const };
}
