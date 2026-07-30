import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Search } from "lucide-react";
import { LANGUAGES, getLanguage } from "@/lib/i18n/languages";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguagePicker({
  value,
  onSelect,
  recent = [],
  showFlags = true,
  maxHeight = "max-h-[26rem]",
}: {
  value: string;
  onSelect: (code: string) => void;
  recent?: string[];
  showFlags?: boolean;
  maxHeight?: string;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.native.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q),
    );
  }, [query]);

  const recentDefs = recent
    .filter((c) => c !== value)
    .map((c) => getLanguage(c))
    .filter((l, i, arr) => arr.findIndex((x) => x.code === l.code) === i)
    .slice(0, 4);

  const row = (code: string, name: string, native: string, flag?: string) => {
    const active = getLanguage(value).code === code;
    return (
      <motion.button
        key={code}
        type="button"
        onClick={() => onSelect(code)}
        whileTap={{ scale: 0.985 }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start transition-colors",
          active ? "bg-primary/10 text-foreground" : "hover:bg-accent",
        )}
        aria-current={active}
      >
        {showFlags && <span className="text-lg leading-none">{flag}</span>}
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium truncate">{native}</span>
          <span className="block text-xs text-muted-foreground truncate">{name}</span>
        </span>
        {active && <Check className="h-4 w-4 text-primary shrink-0" />}
      </motion.button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("lang.search")}
          aria-label={t("lang.search")}
          className="w-full rounded-xl border border-input bg-background ps-9 pe-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className={cn("overflow-y-auto pe-1 space-y-1", maxHeight)}>
        {!query && (
          <>
            <div className="px-3 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("lang.current")}
            </div>
            {(() => {
              const cur = getLanguage(value);
              return row(cur.code, cur.name, cur.native, cur.flag);
            })()}
            {recentDefs.length > 0 && (
              <>
                <div className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("lang.recent")}
                </div>
                {recentDefs.map((l) => row(l.code, l.name, l.native, l.flag))}
              </>
            )}
            <div className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("lang.all")}
            </div>
          </>
        )}
        {filtered.map((l) => row(l.code, l.name, l.native, l.flag))}
        {filtered.length === 0 && (
          <p className="px-3 py-6 text-sm text-muted-foreground text-center">
            {t("lang.noResults")}
          </p>
        )}
      </div>
    </div>
  );
}
