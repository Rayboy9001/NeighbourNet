import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_LANGUAGE,
  detectDeviceLanguage,
  getLanguage,
  isRtl,
} from "./languages";
import { STRINGS, STRINGS_VERSION, type Dictionary, type StringKey } from "./strings";
import { translateBatch } from "./translate";

const LS_LANG = "nn.lang";
const LS_AUTO = "nn.autoTranslate";
const LS_ORIG = "nn.originalFirst";
const LS_RECENT = "nn.recentLangs";
const LS_ONBOARDED = "nn.langOnboarded";
const dictKey = (lang: string) => `nn.dict.v${STRINGS_VERSION}.${lang}`;

const KEYS = Object.keys(STRINGS) as StringKey[];
const BASE_VALUES = KEYS.map((k) => STRINGS[k]);

function readLS(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLS(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

function loadCachedDictionary(lang: string): Dictionary | null {
  const raw = readLS(dictKey(lang));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Dictionary;
    // Only trust the cache if it covers every current key.
    if (KEYS.every((k) => typeof parsed[k] === "string")) return parsed;
    return null;
  } catch {
    return null;
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function buildDictionary(lang: string): Promise<Dictionary> {
  const batches = chunk(BASE_VALUES, 45);
  const translated: string[] = [];
  for (const batch of batches) {
    const items = await translateBatch(batch, lang, "en");
    translated.push(...items.map((i) => i.text));
  }
  const dict: Dictionary = {};
  KEYS.forEach((k, i) => {
    dict[k] = translated[i] ?? STRINGS[k];
  });
  return dict;
}

export interface I18nValue {
  lang: string;
  locale: string;
  dir: "ltr" | "rtl";
  ready: boolean;
  translating: boolean;
  onboarded: boolean;
  recent: string[];
  autoTranslate: boolean;
  showOriginalFirst: boolean;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  setLang: (lang: string) => void;
  completeOnboarding: (lang: string) => void;
  setAutoTranslate: (value: boolean) => void;
  setShowOriginalFirst: (value: boolean) => void;
  formatDate: (value: string | Date) => string;
  formatTime: (value: string | Date) => string;
  formatNumber: (value: number) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(DEFAULT_LANGUAGE);
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [translating, setTranslating] = useState(false);
  const [onboarded, setOnboarded] = useState(true);
  const [recent, setRecent] = useState<string[]>([]);
  const [autoTranslate, setAutoState] = useState(true);
  const [showOriginalFirst, setOriginalState] = useState(false);
  const hydrated = useRef(false);

  // Hydrate from local storage first (instant), then reconcile with the profile.
  useEffect(() => {
    const stored = readLS(LS_LANG);
    if (stored) setLangState(getLanguage(stored).code);
    setOnboarded(readLS(LS_ONBOARDED) === "1");
    setAutoState(readLS(LS_AUTO) !== "0");
    setOriginalState(readLS(LS_ORIG) === "1");
    try {
      const r = JSON.parse(readLS(LS_RECENT) ?? "[]") as string[];
      if (Array.isArray(r)) setRecent(r);
    } catch {
      /* ignore */
    }
    hydrated.current = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "preferred_language,auto_translate,show_original_first,language_onboarded,recent_languages",
        )
        .eq("id", data.user.id)
        .maybeSingle();
      if (!profile) return;
      if (profile.preferred_language) {
        setLangState(getLanguage(profile.preferred_language).code);
        writeLS(LS_LANG, profile.preferred_language);
      }
      setAutoState(profile.auto_translate);
      setOriginalState(profile.show_original_first);
      setOnboarded(profile.language_onboarded);
      writeLS(LS_ONBOARDED, profile.language_onboarded ? "1" : "0");
      setRecent(profile.recent_languages ?? []);
    })();
  }, []);

  // Load / build the UI dictionary for the active language.
  useEffect(() => {
    let cancelled = false;
    if (lang === DEFAULT_LANGUAGE) {
      setDict(null);
      setTranslating(false);
      return;
    }
    const cachedDict = loadCachedDictionary(lang);
    if (cachedDict) {
      setDict(cachedDict);
      return;
    }
    setTranslating(true);
    buildDictionary(lang)
      .then((built) => {
        if (cancelled) return;
        writeLS(dictKey(lang), JSON.stringify(built));
        setDict(built);
      })
      .catch(() => {
        if (!cancelled) setDict(null);
      })
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  // Keep <html lang> and direction in sync.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const def = getLanguage(lang);
    document.documentElement.lang = def.code;
    document.documentElement.dir = def.rtl ? "rtl" : "ltr";
  }, [lang]);

  const persist = useCallback(
    async (patch: Record<string, unknown>) => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      await supabase.from("profiles").update(patch).eq("id", data.user.id);
    },
    [],
  );

  const setLang = useCallback(
    (next: string) => {
      const code = getLanguage(next).code;
      setLangState(code);
      writeLS(LS_LANG, code);
      setRecent((prev) => {
        const updated = [code, ...prev.filter((c) => c !== code)].slice(0, 5);
        writeLS(LS_RECENT, JSON.stringify(updated));
        void persist({ preferred_language: code, recent_languages: updated });
        return updated;
      });
    },
    [persist],
  );

  const completeOnboarding = useCallback(
    (next: string) => {
      setOnboarded(true);
      writeLS(LS_ONBOARDED, "1");
      setLang(next);
      void persist({ language_onboarded: true });
    },
    [persist, setLang],
  );

  const setAutoTranslate = useCallback(
    (value: boolean) => {
      setAutoState(value);
      writeLS(LS_AUTO, value ? "1" : "0");
      void persist({ auto_translate: value });
    },
    [persist],
  );

  const setShowOriginalFirst = useCallback(
    (value: boolean) => {
      setOriginalState(value);
      writeLS(LS_ORIG, value ? "1" : "0");
      void persist({ show_original_first: value });
    },
    [persist],
  );

  const t = useCallback(
    (key: StringKey, vars?: Record<string, string | number>) => {
      let value: string = dict?.[key] ?? STRINGS[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return value;
    },
    [dict],
  );

  const locale = getLanguage(lang).locale;

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      locale,
      dir: isRtl(lang) ? "rtl" : "ltr",
      ready: lang === DEFAULT_LANGUAGE || dict !== null,
      translating,
      onboarded,
      recent,
      autoTranslate,
      showOriginalFirst,
      t,
      setLang,
      completeOnboarding,
      setAutoTranslate,
      setShowOriginalFirst,
      formatDate: (v) =>
        new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(v)),
      formatTime: (v) =>
        new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(new Date(v)),
      formatNumber: (v) => new Intl.NumberFormat(locale).format(v),
    }),
    [
      lang,
      locale,
      dict,
      translating,
      onboarded,
      recent,
      autoTranslate,
      showOriginalFirst,
      t,
      setLang,
      completeOnboarding,
      setAutoTranslate,
      setShowOriginalFirst,
    ],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

export { LANGUAGES, getLanguage, languageName, detectDeviceLanguage } from "./languages";
export type { LanguageDef } from "./languages";
export type { StringKey } from "./strings";
