import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createPoll, joinSquare, replyAsBot, sendMessage, summariseThread } from "./square.server";

export const sendSquareMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        squareId: z.string().uuid(),
        threadId: z.string().uuid(),
        body: z.string().max(1000).default(""),
        imagePath: z.string().max(300).nullable().optional(),
        reportId: z.string().uuid().nullable().optional(),
        replyToId: z.string().uuid().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) =>
    sendMessage({
      userId: context.userId,
      squareId: data.squareId,
      threadId: data.threadId,
      body: data.body,
      imagePath: data.imagePath ?? null,
      reportId: data.reportId ?? null,
      replyToId: data.replyToId ?? null,
    }),
  );

export const askNeighbourBot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        squareId: z.string().uuid(),
        threadId: z.string().uuid(),
        question: z.string().min(2).max(1000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => ({
    messageId: await replyAsBot(data.squareId, data.threadId, data.question, null),
  }));

export const summariseSquareThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ squareId: z.string().uuid(), threadId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => ({
    messageId: await summariseThread(data.squareId, data.threadId),
  }));

export const createSquarePoll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        squareId: z.string().uuid(),
        threadId: z.string().uuid(),
        question: z.string().min(4).max(200),
        options: z.array(z.string().min(1).max(60)).min(2).max(5),
        hours: z.number().int().min(1).max(168),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) =>
    createPoll({
      userId: context.userId,
      squareId: data.squareId,
      threadId: data.threadId,
      question: data.question,
      options: data.options,
      hours: data.hours,
    }),
  );

export const joinSquareRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ squareId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => joinSquare(context.userId, data.squareId));
