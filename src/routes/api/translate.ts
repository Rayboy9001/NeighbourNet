import { createFileRoute } from "@tanstack/react-router";

type Op = "translate" | "detect" | "improve";

interface Body {
  op?: Op;
  texts?: string[];
  text?: string;
  target?: string;
  source?: string | null;
  context?: string;
}

const MODEL = "openai/gpt-5.6-sol";

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function callGateway(
  key: string,
  messages: { role: "system" | "user"; content: string }[],
): Promise<{ ok: true; content: string } | { ok: false; status: number; error: string }> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      reasoning_effort: "none",
      messages,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("translate gateway error", res.status, text);
    return {
      ok: false,
      status: res.status,
      error:
        res.status === 429
          ? "Translation service is busy. Please try again shortly."
          : res.status === 402
            ? "AI credits are exhausted for this workspace."
            : "Translation failed. Please try again.",
    };
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return { ok: true, content: data.choices?.[0]?.message?.content ?? "" };
}

function extractJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.search(/[[{]/);
    const end = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export const Route = createFileRoute("/api/translate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return json({ error: "Translation is not configured." }, 500);

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return json({ error: "Invalid request." }, 400);
        }

        const op: Op = body.op ?? "translate";

        // ---------- language detection ----------
        if (op === "detect") {
          const text = (body.text ?? "").trim().slice(0, 600);
          if (!text) return json({ language: null });
          const result = await callGateway(key, [
            {
              role: "system",
              content:
                'You detect languages. Reply with JSON only: {"language":"<BCP-47 code>","confidence":0-1}. Use zh-Hans / zh-Hant for Chinese. No prose.',
            },
            { role: "user", content: text },
          ]);
          if (!result.ok) return json({ error: result.error }, result.status);
          const parsed = extractJson(result.content) as {
            language?: string;
            confidence?: number;
          } | null;
          return json({
            language: parsed?.language ?? null,
            confidence: parsed?.confidence ?? null,
          });
        }

        // ---------- writing assistant ----------
        if (op === "improve") {
          const text = (body.text ?? "").trim().slice(0, 2000);
          const lang = body.target ?? "en";
          if (!text) return json({ error: "Nothing to improve." }, 400);
          const result = await callGateway(key, [
            {
              role: "system",
              content: `You are NeighbourBot's report-writing assistant for a community issue-reporting app.
Rewrite the user's rough note into one clear, specific, actionable report description.
Rules:
- Write ONLY in the language identified by the BCP-47 code "${lang}".
- Keep every fact the user gave. Never invent street names, numbers, or times that were not implied.
- Where the user was vague, describe the hazard, who is affected, and why it matters — generically, not with invented specifics.
- 1-3 sentences, plain and calm. No headings, no quotes, no preamble.
Reply with the rewritten text only.`,
            },
            {
              role: "user",
              content: body.context ? `Category: ${body.context}\n\n${text}` : text,
            },
          ]);
          if (!result.ok) return json({ error: result.error }, result.status);
          return json({ text: result.content.trim() });
        }

        // ---------- translation (batched + cached) ----------
        const target = body.target ?? "en";
        const source = body.source ?? null;
        const texts = (Array.isArray(body.texts) ? body.texts : [])
          .map((t) => (typeof t === "string" ? t : ""))
          .slice(0, 200);
        if (texts.length === 0) return json({ items: [] });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const hashes = await Promise.all(
          texts.map((t) => sha256(`${source ?? "auto"}|${target}|${t}`)),
        );
        const unique = Array.from(new Set(hashes));

        const cached = new Map<
          string,
          { translated_text: string; source_lang: string | null; approximate: boolean }
        >();
        if (unique.length) {
          const { data } = await supabaseAdmin
            .from("translation_cache")
            .select("source_hash,translated_text,source_lang,approximate")
            .eq("target_lang", target)
            .in("source_hash", unique);
          for (const row of data ?? []) {
            cached.set(row.source_hash, {
              translated_text: row.translated_text,
              source_lang: row.source_lang,
              approximate: row.approximate,
            });
          }
        }

        const missingIdx: number[] = [];
        const seen = new Set<string>();
        texts.forEach((t, i) => {
          const h = hashes[i];
          if (cached.has(h) || seen.has(h) || !t.trim()) return;
          seen.add(h);
          missingIdx.push(i);
        });

        let detectedLang: string | null = source;
        let approximate = false;

        if (missingIdx.length > 0) {
          const payload = missingIdx.map((i) => texts[i]);
          const result = await callGateway(key, [
            {
              role: "system",
              content: `You are a professional translator for a neighbourhood community platform.
Translate each item of the input JSON array into the language with BCP-47 code "${target}".
Rules:
- Preserve meaning, tone, and register. Do not translate word-for-word when it hurts clarity.
- Keep technical terms, brand names, place names, and proper nouns intact (transliterate only when that is the norm in the target language).
- Preserve markdown, emoji, punctuation, and {placeholder} tokens exactly as they appear.
- If an item is already in the target language, return it unchanged.
- Return the SAME number of items, in the SAME order.
Reply with JSON only, no prose:
{"source_language":"<BCP-47 code of the input>","approximate":<true if you are unsure about any item>,"translations":["...","..."]}`,
            },
            { role: "user", content: JSON.stringify(payload) },
          ]);
          if (!result.ok) return json({ error: result.error }, result.status);

          const parsed = extractJson(result.content) as {
            source_language?: string;
            approximate?: boolean;
            translations?: string[];
          } | null;
          const out = Array.isArray(parsed?.translations) ? parsed!.translations : [];
          detectedLang = parsed?.source_language ?? source;
          approximate = Boolean(parsed?.approximate);

          const rows: {
            source_hash: string;
            target_lang: string;
            source_lang: string | null;
            source_text: string;
            translated_text: string;
            approximate: boolean;
          }[] = [];

          missingIdx.forEach((originalIndex, k) => {
            const translated = typeof out[k] === "string" ? out[k] : texts[originalIndex];
            const h = hashes[originalIndex];
            cached.set(h, {
              translated_text: translated,
              source_lang: detectedLang,
              approximate,
            });
            rows.push({
              source_hash: h,
              target_lang: target,
              source_lang: detectedLang,
              source_text: texts[originalIndex],
              translated_text: translated,
              approximate,
            });
          });

          if (rows.length) {
            const { error } = await supabaseAdmin
              .from("translation_cache")
              .upsert(rows, { onConflict: "source_hash,target_lang" });
            if (error) console.error("translation cache write failed", error.message);
          }
        }

        const items = texts.map((t, i) => {
          const hit = cached.get(hashes[i]);
          return {
            text: hit?.translated_text ?? t,
            sourceLang: hit?.source_lang ?? detectedLang,
            approximate: hit?.approximate ?? false,
          };
        });

        return json({
          items,
          sourceLang: detectedLang,
          cachedAll: missingIdx.length === 0,
        });
      },
    },
  },
});
