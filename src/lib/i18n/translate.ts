const memo = new Map<string, string>();

export interface TranslatedItem {
  text: string;
  sourceLang: string | null;
  approximate: boolean;
}

async function post<T>(body: unknown): Promise<T> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok || data.error) throw new Error(data.error ?? "Translation failed");
  return data;
}

/** Translate a batch of strings, using an in-memory cache on top of the server cache. */
export async function translateBatch(
  texts: string[],
  target: string,
  source?: string | null,
): Promise<TranslatedItem[]> {
  const results: (TranslatedItem | null)[] = texts.map((t) => {
    const hit = memo.get(`${target}|${source ?? "auto"}|${t}`);
    return hit === undefined ? null : { text: hit, sourceLang: source ?? null, approximate: false };
  });

  const missing = texts
    .map((t, i) => ({ t, i }))
    .filter(({ i, t }) => results[i] === null && t.trim().length > 0);

  if (missing.length > 0) {
    const data = await post<{ items: TranslatedItem[] }>({
      op: "translate",
      texts: missing.map((m) => m.t),
      target,
      source: source ?? null,
    });
    missing.forEach((m, k) => {
      const item = data.items[k] ?? { text: m.t, sourceLang: null, approximate: false };
      memo.set(`${target}|${source ?? "auto"}|${m.t}`, item.text);
      results[m.i] = item;
    });
  }

  return texts.map(
    (t, i) => results[i] ?? { text: t, sourceLang: source ?? null, approximate: false },
  );
}

export async function translateText(
  text: string,
  target: string,
  source?: string | null,
): Promise<TranslatedItem> {
  const [item] = await translateBatch([text], target, source);
  return item;
}

export async function detectLanguage(text: string): Promise<string | null> {
  if (text.trim().length < 6) return null;
  try {
    const data = await post<{ language: string | null }>({ op: "detect", text });
    return data.language;
  } catch {
    return null;
  }
}

export async function improveText(text: string, target: string, context?: string): Promise<string> {
  const data = await post<{ text: string }>({ op: "improve", text, target, context });
  return data.text;
}
