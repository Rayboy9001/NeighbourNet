import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { getLanguage } from "@/lib/i18n/languages";
import { LanguagePicker } from "@/components/LanguagePicker";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings/language")({
  head: () => ({
    meta: [
      { title: "Language & Region · NeighbourNet" },
      {
        name: "description",
        content:
          "Choose your preferred language and control how NeighbourNet translates your neighbours' reports.",
      },
      { property: "og:title", content: "Language & Region · NeighbourNet" },
      {
        property: "og:description",
        content: "Use NeighbourNet in your own language, with automatic translation.",
      },
    ],
  }),
  component: LanguageSettings,
});

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-start gap-3 p-4 rounded-2xl border border-border bg-card text-start hover:border-primary/30 transition-colors"
    >
      <span className="flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>
      </span>
      <span
        className={cn(
          "mt-0.5 h-6 w-11 rounded-full p-0.5 shrink-0 transition-colors",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 600, damping: 34 }}
          className={cn(
            "block h-5 w-5 rounded-full bg-background shadow-card",
            checked ? "ms-auto" : "me-auto",
          )}
        />
      </span>
    </button>
  );
}

function LanguageSettings() {
  const {
    t,
    lang,
    setLang,
    recent,
    autoTranslate,
    setAutoTranslate,
    showOriginalFirst,
    setShowOriginalFirst,
    translating,
    locale,
    formatDate,
    formatTime,
    formatNumber,
  } = useI18n();

  const def = getLanguage(lang);
  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          {t("lang.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("lang.subtitle")}</p>
      </div>

      <section className="bg-card border border-border rounded-2xl p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">🌐 {t("lang.preferred")}</h2>
          {translating && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("tr.translating")}
            </span>
          )}
        </div>
        <LanguagePicker
          value={lang}
          recent={recent}
          onSelect={(code) => {
            if (getLanguage(code).code === def.code) return;
            setLang(code);
            toast.success(t("lang.changed"));
          }}
        />
      </section>

      <section className="space-y-3">
        <Toggle
          checked={autoTranslate}
          onChange={setAutoTranslate}
          label={t("lang.autoTranslate")}
          description={t("lang.autoTranslateSub")}
        />
        <Toggle
          checked={showOriginalFirst}
          onChange={setShowOriginalFirst}
          label={t("lang.originalFirst")}
          description={t("lang.originalFirstSub")}
        />
      </section>

      <section className="bg-card border border-border rounded-2xl p-4 md:p-5">
        <h2 className="font-semibold">{t("lang.regionPreview")}</h2>
        <dl className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">{t("lang.dateFormat")}</dt>
            <dd className="font-medium">{formatDate(now)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("lang.timeFormat")}</dt>
            <dd className="font-medium">{formatTime(now)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("lang.numberFormat")}</dt>
            <dd className="font-medium">{formatNumber(1234567.89)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          {def.native} · {locale} · {def.rtl ? "RTL" : "LTR"}
        </p>
      </section>
    </div>
  );
}
