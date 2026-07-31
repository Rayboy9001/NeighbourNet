import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  loadLeaderboard,
  loadOrCreateDailyChallenge,
  scoreAndSaveAttempt,
} from "./challenge.server";

export const getDailyChallenge = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(data),
  )
  .handler(async ({ data }) => loadOrCreateDailyChallenge(data.dateKey));

export const submitChallengeAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        challengeId: z.string().uuid(),
        answers: z
          .array(
            z.object({
              selected: z.number().int().min(0).max(3).nullable(),
              remainingMs: z.number().int().min(0).max(60000),
            }),
          )
          .max(30),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) =>
    scoreAndSaveAttempt(context.userId, data.challengeId, data.answers),
  );

export const getLeaderboard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ range: z.enum(["today", "week", "month", "all"]) }).parse(data),
  )
  .handler(async ({ data }) => loadLeaderboard(data.range));
