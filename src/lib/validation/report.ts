/**
 * Central validation + sanitization rules for report submissions.
 *
 * This module is pure (no Supabase, no React) so it can be shared by the
 * client form, the server function, and the automated tests.
 */
import { z } from "zod";

export const REPORT_CATEGORIES = [
  "roads",
  "electricity",
  "water",
  "waste",
  "environment",
  "safety",
  "animals",
  "other",
] as const;

export type ReportCategoryValue = (typeof REPORT_CATEGORIES)[number];

export const TITLE_MIN = 5;
export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 2000;
export const ADDRESS_MAX = 200;

/** Characters that can be used to inject markup/scripts. */
const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Sanitize free-form user text:
 *  - strips control characters (except newline/tab)
 *  - removes any HTML/script markup entirely
 *  - escapes leftover angle brackets & quotes so nothing can ever be
 *    interpreted as markup downstream
 *  - collapses excessive blank lines and trims
 */
export function sanitizeText(input: string): string {
  return input
    .normalize("NFC")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    // strip script/style blocks including their content
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    // strip any remaining tags
    .replace(/<\/?[a-z][^>]*>/gi, "")
    // neutralise javascript: / data: URLs written as plain text
    .replace(/javascript\s*:/gi, "")
    .replace(/data\s*:\s*text\/html/gi, "")
    .replace(/[&<>"']/g, (c) => ESCAPE_MAP[c] ?? c)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const sanitizedString = z.string().transform(sanitizeText);

const optionalNumber = z
  .union([z.number(), z.null(), z.undefined()])
  .transform((v) => (v === undefined ? null : v));

export const reportInputSchema = z.object({
  title: sanitizedString.pipe(
    z
      .string()
      .min(TITLE_MIN, `Title must be at least ${TITLE_MIN} characters`)
      .max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters`),
  ),
  description: sanitizedString.pipe(
    z.string().max(DESCRIPTION_MAX, `Description must be at most ${DESCRIPTION_MAX} characters`),
  ),
  category: z.enum(REPORT_CATEGORIES, {
    errorMap: () => ({ message: "Choose a valid category" }),
  }),
  latitude: optionalNumber.pipe(
    z
      .number()
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90")
      .nullable(),
  ),
  longitude: optionalNumber.pipe(
    z
      .number()
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180")
      .nullable(),
  ),
  address: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => {
      if (v === null || v === undefined) return null;
      const clean = sanitizeText(v);
      return clean.length === 0 ? null : clean;
    })
    .pipe(z.string().max(ADDRESS_MAX, "Address is too long").nullable()),
  image_url: z
    .union([z.string().max(500), z.null(), z.undefined()])
    .transform((v) => v ?? null),
  original_language: z
    .union([z.string().max(20), z.null(), z.undefined()])
    .transform((v) => v ?? null),
});

export type ReportInput = z.input<typeof reportInputSchema>;
export type ValidatedReport = z.output<typeof reportInputSchema>;

export type ValidationResult =
  | { success: true; data: ValidatedReport }
  | { success: false; errors: Record<string, string> };

/** Validate + sanitize a report payload. Never throws. */
export function validateReport(input: unknown): ValidationResult {
  const parsed = reportInputSchema.safeParse(input);
  if (parsed.success) return { success: true, data: parsed.data };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}

/** Same as validateReport but throws a single readable error (server use). */
export function parseReportOrThrow(input: unknown): ValidatedReport {
  const result = validateReport(input);
  if (!result.success) {
    throw new Error(Object.values(result.errors).join(" · "));
  }
  return result.data;
}
