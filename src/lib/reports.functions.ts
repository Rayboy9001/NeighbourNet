import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseReportOrThrow } from "@/lib/validation/report";

/**
 * Server-side validated report submission.
 * All rules live in @/lib/validation/report so client + server agree.
 */
export const submitReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => parseReportOrThrow(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("reports")
      .insert({
        user_id: context.userId,
        title: data.title,
        description: data.description,
        category: data.category,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        image_url: data.image_url,
        original_language: data.original_language,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // All point changes go through the single awardPoints system.
    const { awardPoints } = await import("./points.server");
    const award = await awardPoints(
      context.userId,
      20,
      "Community Report Submitted",
      `report:${row.id}`,
    );
    return { id: row.id as string, pointsBalance: award.balance };
  });
