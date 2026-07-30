import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, Sparkles } from "lucide-react";
import { LanguagePicker } from "@/components/LanguagePicker";
import { useI18n } from "@/lib/i18n";
import { detectDeviceLanguage, getLanguage } from "@/lib/i18n/languages";

/**
 * First-run language chooser. Suggests the device language but never forces it.
 */
export function LanguageSetupDialog() {
  const { onboarded, completeOnboarding, t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState(lang);
  const [detected, setDetected] = useState<string | null>(null);

  useEffect(() => {
    if (onboarded) return;
    const device = detectDeviceLanguage();
    setDetected(device);
    setChoice(device);
    const id = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(id);
  }, [onboarded]);

  if (onboarded) return null;

  const detectedDef = detected ? getLanguage(detected) : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] grid place-items-center p-4 bg-foreground/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={t("setup.title")}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="w-full max-w-md rounded-3xl border border-border bg-card p-5 shadow-pop"
          >
            <div className="flex items-center gap-2 text-primary">
              <Globe className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                NeighbourNet
              </span>
            </div>
            <h2 className="mt-2 text-xl font-bold">{t("setup.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("setup.subtitle")}</p>

            {detectedDef && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>
                  {t("setup.detected")}: <strong>{detectedDef.native}</strong>
                </span>
              </div>
            )}

            <div className="mt-4">
              <LanguagePicker
                value={choice}
                onSelect={setChoice}
                maxHeight="max-h-64"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                completeOnboarding(choice);
                setOpen(false);
              }}
              className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-card press"
            >
              {t("setup.confirm")}
            </button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {t("setup.changeLater")}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
