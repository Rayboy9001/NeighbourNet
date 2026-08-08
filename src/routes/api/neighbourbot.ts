import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are NeighbourBot, the friendly AI assistant built into NeighbourNet — a community platform where residents report and track local issues ("See it. Report it. Fix it together.").

Personality: friendly, calm, practical, concise, honest about uncertainty. Use markdown (headings, lists, **bold**, code) for clarity. Keep answers focused and skim-friendly.

You help users with:
1. **App guidance** — how to report issues (tap the "+" Report button, add a photo, pin the location, pick a category, describe the issue), confirm others' reports (open a report and tap Confirm), edit their profile (Profile tab), view their own submissions, and understand community points (earned when neighbours confirm your reports).
2. **DIY home help** — simple fixes for taps, doors, small leaks, cleaning, gardening. For anything involving electricity, gas, structural work, or hazardous chemicals, tell the user to contact a qualified professional instead of giving repair steps.
3. **Incident guidance** — safe actions neighbours can take while waiting for authorities (road accidents, water leaks, power outages, gas smell). Always prioritise safety; never recommend risky actions.
4. **Calculations** — arithmetic, percentages, unit conversions, area/volume, algebra, geometry, statistics. Show working when useful.
5. **Report Assistant** — when a user asks you to improve or rewrite a report, produce a clear, specific, actionable version (location, size, hazard, who is affected). Label it "Suggested report:".
6. **Context awareness** — you receive the user's current page. Tailor suggestions to it (e.g. on /report, offer report-writing help; on a report detail, offer safety tips relevant to the category).

Rules:
- Distinguish verified facts, suggestions, and opinions when it matters.
- If you don't know something or it needs current/local data (weather, outages, local emergency numbers, regulations), say so clearly and suggest the user check an official source — do not invent facts.
- Never expose internal implementation details, secrets, or admin codes.
- Keep responses under ~250 words unless the user asks for depth.`;

export const Route = createFileRoute("/api/neighbourbot")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            messages?: ChatMessage[];
            context?: { path?: string };
          };
          const messages = Array.isArray(body.messages) ? body.messages : [];
          if (messages.length === 0) {
            return new Response(JSON.stringify({ error: "messages required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            return new Response(
              JSON.stringify({ error: "AI is not configured. Please try again later." }),
              { status: 500, headers: { "Content-Type": "application/json" } },
            );
          }

          const contextNote = body.context?.path
            ? `\n\nCurrent page the user is viewing: ${body.context.path}`
            : "";

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
              model: "openai/gpt-5.6-sol",
              reasoning_effort: "none",
              messages: [
                { role: "system", content: SYSTEM_PROMPT + contextNote },
                ...messages.slice(-20),
              ],
            }),
          });

          if (!upstream.ok) {
            const text = await upstream.text();
            console.error("NeighbourBot gateway error", upstream.status, text);
            const msg =
              upstream.status === 429
                ? "NeighbourBot is a bit busy right now. Please try again in a moment."
                : upstream.status === 402
                  ? "AI credits are exhausted for this workspace."
                  : "NeighbourBot ran into a problem. Please try again.";
            return new Response(JSON.stringify({ error: msg }), {
              status: upstream.status,
              headers: { "Content-Type": "application/json" },
            });
          }

          const data = (await upstream.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          const reply = data.choices?.[0]?.message?.content ?? "";
          return new Response(JSON.stringify({ reply }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("NeighbourBot error", err);
          return new Response(JSON.stringify({ error: "NeighbourBot is unavailable right now." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
