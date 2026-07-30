import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Flag, Languages, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { getLanguage, languageName } from "@/lib/i18n/languages";
import { translateText } from "@/lib/i18n/translate";
import { cn } from "@/lib/utils";

interface State {
  translated: string | null;
  detected: string | null;
  approximate: boolean;
  loading: boolean;
}

/**
 * Translates a piece of user-generated content into the viewer's language.
 * The original is never modified — it is always one tap away.
 */
export function useTranslatedContent(text: string, sourceLang?: string | null) {
  const { lang, autoTranslate, showOriginalFirst } = useI18n();
  const [state, setState] = useState<State>({
    translated: null,
    detected: sourceLang ?? null,
    approximate: false,
    loading: false,
  });
  const [showOriginal, setShowOriginal] = useState(showOriginalFirst);
  const [manual, setManual] = useState(false);

  const sameLanguage = Boolean(
    sourceLang && getLanguage(sourceLang).code === getLanguage(lang).code,
  );
  const shouldTranslate = (autoTranslate || manual) && text.trim().length > 0 && !sameLanguage;

  useEffect(() => {
    setShowOriginal(showOriginalFirst);
  }, [showOriginalFirst, lang]);

  useEffect(() => {
    let cancelled = false;
    if (!shouldTranslate) {
      setState((s) => ({ ...s, translated: null }));
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    translateText(text, lang, sourceLang ?? null)
      .then((item) => {
        if (cancelled) return;
        setState({
          translated: item.text,
          detected: item.sourceLang ?? sourceLang ?? null,
          approximate: item.approximate,
          loading: false,
        });
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [text, lang, sourceLang, shouldTranslate]);

  const detectedCode = state.detected;
  const isDifferent =
    state.translated !== null && state.translated.trim() !== text.trim();
  const isTranslated = isDifferent && !showOriginal;

  return {
    display: isTranslated ? state.translated! : text,
    original: text,
    translated: state.translated,
    detectedLanguage: detectedCode,
    approximate: state.approximate,
    loading: state.loading,
    isTranslated,
    canToggle: isDifferent,
    showingOriginal: showOriginal,
    toggle: () => setShowOriginal((v) => !v),
    requestTranslation: () => setManual(true),
  };
}

async function reportTranslation(source: string, translated: string, target: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("translation_reports").insert({
    user_id: data.user.id,
    source_text: source.slice(0, 2000),
    translated_text: translated.slice(0, 2000),
    target_lang: target,
  });
}

export function TranslationBar({
  original,
  translated,
  detectedLanguage,
  approximate,
  showingOriginal,
  onToggle,
  compact,
}: {
  original: string;
  translated: string;
  detectedLanguage: string | null;
  approximate: boolean;
  showingOriginal: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  const { t, lang } = useI18n();

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(translated);
      toast.success(t("tr.copied"));
    } catch {
      toast.error(t("error.generic"));
    }
  }, [translated, t]);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground",
        compact ? "mt-1" : "mt-2",
      )}
    >
      <span className="inline-flex items-center gap-1">
        <Languages className="h-3.5 w-3.5" />
        {showingOriginal
          ? t("tr.originalIn", { language: languageName(detectedLanguage) })
          : t("tr.translatedFrom", { language: languageName(detectedLanguage) })}
      </span>
      <button
        type="button"
        onClick={onToggle}
        className="font-medium text-primary hover:underline"
      >
        {showingOriginal ? t("tr.showTranslation") : t("tr.showOriginal")}
      </button>
      {!compact && (
        <>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <Copy className="h-3.5 w-3.5" /> {t("tr.copy")}
          </button>
          <button
            type="button"
            onClick={async () => {
              await reportTranslation(original, translated, lang);
              toast.success(t("tr.reported"));
            }}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <Flag className="h-3.5 w-3.5" /> {t("tr.reportIssue")}
          </button>
        </>
      )}
      {approximate && <span className="italic">{t("tr.approximate")}</span>}
    </div>
  );
}

/**
 * Drop-in replacement for rendering user content. Shows the viewer's language
 * with a subtle "Translated from ..." label and a toggle back to the original.
 */
export function TranslatedText({
  text,
  sourceLang,
  className,
  compact,
  hideControls,
  as: Tag = "p",
}: {
  text: string;
  sourceLang?: string | null;
  className?: string;
  compact?: boolean;
  hideControls?: boolean;
  as?: "p" | "h1" | "h3" | "span" | "div";
}) {
  const tc = useTranslatedContent(text, sourceLang);
  const { t } = useI18n();

  return (
    <div className={cn(tc.loading && "opacity-80 transition-opacity")}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tc.showingOriginal ? "original" : "translated"}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.18 }}
        >
          <Tag className={className}>{tc.display}</Tag>
        </motion.div>
      </AnimatePresence>
      {tc.loading && !tc.translated && (
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> {t("tr.translating")}
        </span>
      )}
      {!hideControls && tc.canToggle && (
        <TranslationBar
          original={tc.original}
          translated={tc.translated ?? ""}
          detectedLanguage={tc.detectedLanguage}
          approximate={tc.approximate}
          showingOriginal={tc.showingOriginal}
          onToggle={tc.toggle}
          compact={compact}
        />
      )}
    </div>
  );
}
