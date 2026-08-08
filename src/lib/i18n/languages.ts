export interface LanguageDef {
  code: string;
  /** English name */
  name: string;
  /** Endonym — the language's own name */
  native: string;
  /** Optional visual aid only; flags never define a language */
  flag?: string;
  rtl?: boolean;
  /** BCP-47 locale used for dates & numbers */
  locale: string;
}

/**
 * Adding a new language is a single entry here — nothing else in the app
 * needs to change. UI strings are translated on demand and cached.
 */
export const LANGUAGES: LanguageDef[] = [
  { code: "af", name: "Afrikaans", native: "Afrikaans", flag: "🇿🇦", locale: "af-ZA" },
  { code: "am", name: "Amharic", native: "አማርኛ", flag: "🇪🇹", locale: "am-ET" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦", rtl: true, locale: "ar" },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇧🇩", locale: "bn-BD" },
  { code: "cs", name: "Czech", native: "Čeština", flag: "🇨🇿", locale: "cs-CZ" },
  { code: "da", name: "Danish", native: "Dansk", flag: "🇩🇰", locale: "da-DK" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪", locale: "de-DE" },
  { code: "el", name: "Greek", native: "Ελληνικά", flag: "🇬🇷", locale: "el-GR" },
  { code: "en", name: "English", native: "English", flag: "🇬🇧", locale: "en-GB" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸", locale: "es-ES" },
  { code: "fa", name: "Persian", native: "فارسی", flag: "🇮🇷", rtl: true, locale: "fa-IR" },
  { code: "fil", name: "Filipino", native: "Filipino", flag: "🇵🇭", locale: "fil-PH" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷", locale: "fr-FR" },
  { code: "ha", name: "Hausa", native: "Hausa", flag: "🇳🇬", locale: "ha-NG" },
  { code: "he", name: "Hebrew", native: "עברית", flag: "🇮🇱", rtl: true, locale: "he-IL" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳", locale: "hi-IN" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩", locale: "id-ID" },
  { code: "ig", name: "Igbo", native: "Asụsụ Igbo", flag: "🇳🇬", locale: "ig-NG" },
  { code: "it", name: "Italian", native: "Italiano", flag: "🇮🇹", locale: "it-IT" },
  { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵", locale: "ja-JP" },
  { code: "ko", name: "Korean", native: "한국어", flag: "🇰🇷", locale: "ko-KR" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu", flag: "🇲🇾", locale: "ms-MY" },
  { code: "nl", name: "Dutch", native: "Nederlands", flag: "🇳🇱", locale: "nl-NL" },
  { code: "pl", name: "Polish", native: "Polski", flag: "🇵🇱", locale: "pl-PL" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹", locale: "pt-PT" },
  { code: "ro", name: "Romanian", native: "Română", flag: "🇷🇴", locale: "ro-RO" },
  { code: "ru", name: "Russian", native: "Русский", flag: "🇷🇺", locale: "ru-RU" },
  { code: "sv", name: "Swedish", native: "Svenska", flag: "🇸🇪", locale: "sv-SE" },
  { code: "sw", name: "Swahili", native: "Kiswahili", flag: "🇰🇪", locale: "sw-KE" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳", locale: "ta-IN" },
  { code: "th", name: "Thai", native: "ไทย", flag: "🇹🇭", locale: "th-TH" },
  { code: "tr", name: "Turkish", native: "Türkçe", flag: "🇹🇷", locale: "tr-TR" },
  { code: "uk", name: "Ukrainian", native: "Українська", flag: "🇺🇦", locale: "uk-UA" },
  { code: "ur", name: "Urdu", native: "اردو", flag: "🇵🇰", rtl: true, locale: "ur-PK" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", flag: "🇻🇳", locale: "vi-VN" },
  { code: "yo", name: "Yoruba", native: "Yorùbá", flag: "🇳🇬", locale: "yo-NG" },
  {
    code: "zh-Hans",
    name: "Chinese (Simplified)",
    native: "中文（简体）",
    flag: "🇨🇳",
    locale: "zh-Hans",
  },
  {
    code: "zh-Hant",
    name: "Chinese (Traditional)",
    native: "中文（繁體）",
    flag: "🇹🇼",
    locale: "zh-Hant",
  },
  { code: "zu", name: "Zulu", native: "isiZulu", flag: "🇿🇦", locale: "zu-ZA" },
].sort((a, b) => a.name.localeCompare(b.name));

export const DEFAULT_LANGUAGE = "en";

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code.toLowerCase(), l]));

export function getLanguage(code: string | null | undefined): LanguageDef {
  if (!code) return BY_CODE.get(DEFAULT_LANGUAGE)!;
  const exact = BY_CODE.get(code.toLowerCase());
  if (exact) return exact;
  const base = code.toLowerCase().split("-")[0];
  if (base === "zh") return BY_CODE.get("zh-hans")!;
  return BY_CODE.get(base) ?? BY_CODE.get(DEFAULT_LANGUAGE)!;
}

export function languageName(code: string | null | undefined): string {
  if (!code) return "Unknown";
  return getLanguage(code).name;
}

export function isSupported(code: string): boolean {
  const lower = code.toLowerCase();
  if (BY_CODE.has(lower)) return true;
  const base = lower.split("-")[0];
  return base === "zh" || BY_CODE.has(base);
}

/** Best-effort detection of the device / browser language. */
export function detectDeviceLanguage(): string {
  if (typeof navigator === "undefined") return DEFAULT_LANGUAGE;
  const candidates = [...(navigator.languages ?? []), navigator.language].filter(
    Boolean,
  ) as string[];
  for (const c of candidates) {
    const lower = c.toLowerCase();
    if (lower.startsWith("zh")) {
      return lower.includes("hant") ||
        lower.includes("tw") ||
        lower.includes("hk") ||
        lower.includes("mo")
        ? "zh-Hant"
        : "zh-Hans";
    }
    if (isSupported(c)) return getLanguage(c).code;
  }
  return DEFAULT_LANGUAGE;
}

export function isRtl(code: string): boolean {
  return Boolean(getLanguage(code).rtl);
}
