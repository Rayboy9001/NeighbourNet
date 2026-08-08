import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Current balance straight from the database — never from cache. */
export const getMyPoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getPointsBalance } = await import("./points.server");
    return { balance: await getPointsBalance(context.userId) };
  });

export const getMyPointHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ limit: z.number().int().min(1).max(100).default(25) }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { getPointHistory } = await import("./points.server");
    return getPointHistory(context.userId, data.limit);
  });

export const getPointsDebug = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ search: z.string().max(80).optional() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    if (!isAdmin) throw new Error("Forbidden");
    const { loadPointsDebug } = await import("./points.server");
    return loadPointsDebug(data.search);
  });
