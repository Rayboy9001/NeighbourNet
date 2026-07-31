import type { QuizQuestion } from "./challenge";
import { CHALLENGE_CATEGORIES, QUESTIONS_PER_CHALLENGE } from "./challenge";

/**
 * Deterministic fallback bank used when the AI gateway is unavailable.
 * Enough variety that the daily rotation still feels fresh.
 */
const FALLBACK: Omit<QuizQuestion, "id">[] = [
  {
    category: "plumbing",
    question: "A tap in your kitchen is dripping constantly. What should you do first?",
    options: ["Ignore it", "Tighten the tap if possible, then check the washer", "Paint over it", "Pour hot water into it"],
    correctIndex: 1,
    explanation: "A drip is usually a worn washer or a loose tap head. Gently tightening it and replacing the washer stops litres of daily waste — if it keeps dripping, shut off the supply valve and call a plumber.",
  },
  {
    category: "emergency",
    question: "You smell gas inside your home. Who should you contact?",
    options: ["Your neighbour", "Emergency services or your gas supplier", "The post office", "Nobody, wait it out"],
    correctIndex: 1,
    explanation: "Leave the building, avoid switches and flames, then call emergency services or your gas supplier's emergency line from outside.",
  },
  {
    category: "fire",
    question: "Which extinguisher should NEVER be used on an electrical fire?",
    options: ["CO₂", "Dry powder", "Water", "Clean agent"],
    correctIndex: 2,
    explanation: "Water conducts electricity, so it can electrocute you and spread the fire. Use CO₂ or dry powder on electrical fires — and only if it is safe to stay.",
  },
  {
    category: "electrical",
    question: "A socket feels warm and slightly discoloured. The safest first step is to:",
    options: ["Keep using it carefully", "Stop using it and switch off that circuit", "Cover it with tape", "Spray it with water"],
    correctIndex: 1,
    explanation: "Heat and discolouration signal loose wiring or overload — a real fire risk. Isolate the circuit at the consumer unit and get a qualified electrician.",
  },
  {
    category: "road",
    question: "Scenario: after a storm you see a power line lying across the road. What do you do first?",
    options: ["Move it with a wooden stick", "Stay well back, keep others away and call emergency services", "Drive over it slowly", "Take a close-up photo for your report"],
    correctIndex: 1,
    explanation: "Always assume a downed line is live — even wood can conduct when wet. Stay at least 10 metres away, warn others, and report it to emergency services and the power company before posting it to NeighbourNet.",
    scenario: true,
  },
  {
    category: "water",
    question: "Roughly how much water can a running tap use per minute?",
    options: ["About 0.5 litres", "About 6–12 litres", "About 50 litres", "About 100 litres"],
    correctIndex: 1,
    explanation: "Most taps flow at 6–12 litres a minute. Turning the tap off while brushing your teeth saves several litres every single day.",
  },
  {
    category: "recycling",
    question: "Which of these usually should NOT go in a household recycling bin?",
    options: ["Clean cardboard", "Greasy pizza box", "Rinsed glass jar", "Plastic bottle"],
    correctIndex: 1,
    explanation: "Food grease contaminates paper recycling. Tear off the clean lid to recycle and compost or bin the greasy base.",
  },
  {
    category: "home",
    question: "Condensation and black mould keep appearing on a bedroom wall. Best first response?",
    options: ["Paint over the mould", "Improve ventilation and reduce humidity, then clean the mould", "Seal the window permanently", "Turn off the heating"],
    correctIndex: 1,
    explanation: "Mould is a symptom of trapped moisture. Ventilate daily, use an extractor or dehumidifier, then clean affected areas — painting over it only hides the cause.",
  },
  {
    category: "weather",
    question: "A heavy storm is forecast tonight. Which action helps most?",
    options: ["Leave garden furniture out", "Secure loose outdoor items and clear drains", "Open all windows", "Park under a large old tree"],
    correctIndex: 1,
    explanation: "Loose items become projectiles and blocked drains cause flooding. Ten minutes of tidying prevents most storm damage around a home.",
  },
  {
    category: "health",
    question: "Standing water in plant pots and buckets mainly attracts:",
    options: ["Bees", "Mosquitoes", "Butterflies", "Earthworms"],
    correctIndex: 1,
    explanation: "Mosquitoes breed in still water within about a week. Emptying containers weekly is the simplest way to cut local mosquito numbers.",
  },
  {
    category: "pets",
    question: "You find a friendly stray dog wandering near a busy road. What is the safest first step?",
    options: ["Chase it off the road", "Keep a calm distance, call animal services and warn drivers if safe", "Feed it chocolate", "Let it into traffic to find its way"],
    correctIndex: 1,
    explanation: "Sudden movement can push a frightened dog into traffic. Stay calm, contact animal control or a local shelter, and only approach if the animal seems relaxed.",
    scenario: true,
  },
  {
    category: "gardening",
    question: "When is the best time to water a garden during hot weather?",
    options: ["Midday", "Early morning or evening", "Whenever convenient", "During the hottest hour"],
    correctIndex: 1,
    explanation: "Watering when it is cool reduces evaporation dramatically, so more water reaches the roots and less is wasted.",
  },
  {
    category: "etiquette",
    question: "Your neighbour's tree drops leaves into your garden every autumn. The best first move is to:",
    options: ["Cut the tree down", "Have a friendly conversation with your neighbour", "Post about them publicly", "Throw the leaves back over"],
    correctIndex: 1,
    explanation: "Most neighbour disputes end quickly with a polite chat. Escalate to mediation or the council only if a direct conversation does not work.",
  },
  {
    category: "environment",
    question: "Which everyday change reduces household carbon output the most?",
    options: ["Turning off a phone charger", "Reducing heating by 1°C and improving insulation", "Using thinner bin bags", "Buying bottled water"],
    correctIndex: 1,
    explanation: "Heating dominates most home energy use — a single degree lower plus better insulation saves far more than switching off small devices.",
  },
  {
    category: "general",
    question: "What is the first thing to do before any DIY work on a light fitting?",
    options: ["Wear gloves", "Switch off the circuit at the consumer unit and test it is dead", "Open a window", "Turn the light switch off only"],
    correctIndex: 1,
    explanation: "A wall switch may only break one conductor. Isolate the circuit at the consumer unit and verify with a tester before touching anything.",
  },
  {
    category: "emergency",
    question: "What belongs in a basic home emergency kit?",
    options: ["Torch, water, first aid kit, power bank", "Candles only", "Spare paint", "Extra keys only"],
    correctIndex: 0,
    explanation: "Light, clean water, first aid supplies and a charged power bank cover the first 24 hours of most outages or evacuations.",
  },
  {
    category: "fire",
    question: "How often should smoke alarms be tested?",
    options: ["Once a year", "Monthly", "Every five years", "Only when they beep"],
    correctIndex: 1,
    explanation: "A monthly press of the test button confirms both the sensor and the battery. Replace the whole unit roughly every ten years.",
  },
  {
    category: "plumbing",
    question: "Scenario: water is pouring from under your kitchen sink. What comes first?",
    options: ["Mop the floor", "Shut off the water supply valve if it is safe to reach", "Call your insurer", "Open the cupboard and wait"],
    correctIndex: 1,
    explanation: "Stopping the flow limits damage. Close the isolation valve under the sink or the main stopcock, then clear water and call a plumber.",
    scenario: true,
  },
  {
    category: "road",
    question: "A pothole is forming on your street. The most useful action for neighbours is to:",
    options: ["Fill it with loose gravel", "Report it with a photo and location so it can be tracked and fixed", "Ignore it until it grows", "Place a chair in the hole"],
    correctIndex: 1,
    explanation: "A documented report with a photo and pin lets the council prioritise repairs — and other neighbours can confirm it to raise its urgency.",
  },
  {
    category: "electrical",
    question: "Which practice most increases the risk of an electrical fire?",
    options: ["Using an RCD-protected socket", "Daisy-chaining several extension leads", "Unplugging unused devices", "Replacing damaged cables"],
    correctIndex: 1,
    explanation: "Chained extension leads easily exceed their rated current and overheat. Use one properly rated lead per socket.",
  },
];

function hashSeed(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(items: T[], seed: number) {
  const arr = [...items];
  let s = seed || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function fallbackQuestions(dateKey: string): QuizQuestion[] {
  const seed = hashSeed(dateKey);
  const pool = seededShuffle(FALLBACK, seed);
  const out: QuizQuestion[] = [];
  for (let i = 0; i < QUESTIONS_PER_CHALLENGE; i++) {
    const base = pool[i % pool.length];
    const order = seededShuffle([0, 1, 2, 3], seed + i * 7);
    const options = order.map((idx) => base.options[idx]) as QuizQuestion["options"];
    out.push({
      ...base,
      id: `${dateKey}-${i}`,
      options,
      correctIndex: order.indexOf(base.correctIndex),
    });
  }
  return out;
}

const GEN_PROMPT = (dateKey: string, categories: string) => `Create today's NeighbourNet Community Challenge for ${dateKey}.

Produce exactly ${QUESTIONS_PER_CHALLENGE} multiple-choice questions that teach practical, real-world neighbourhood knowledge.

Rules:
- Rotate across these categories (use the category key verbatim): ${categories}
- Exactly 4 options per question, exactly one correct.
- Difficulty must increase gradually: first 5 easy, next 5 moderate, last 5 harder.
- At least 4 questions must be "Neighbour Scenarios" (set "scenario": true) describing a realistic situation ("You notice...", "After a storm...").
- Every question needs a friendly 1–2 sentence explanation of WHY the correct answer is safest or best, written like NeighbourBot.
- Never give unsafe DIY advice for gas, electrical or structural work — the correct answer should favour professionals and safety.
- Vary wording and topics so they feel new compared to a typical day.

Return ONLY JSON of the shape:
{"questions":[{"category":"plumbing","question":"...","options":["a","b","c","d"],"correctIndex":0,"explanation":"...","scenario":false}]}`;

export async function generateQuestions(dateKey: string): Promise<QuizQuestion[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return fallbackQuestions(dateKey);

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "none",
        messages: [
          { role: "system", content: "You are NeighbourBot, a practical community-safety quiz writer. Always answer with valid JSON only." },
          {
            role: "user",
            content: GEN_PROMPT(
              dateKey,
              CHALLENGE_CATEGORIES.map((c) => c.key).join(", "),
            ),
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return fallbackQuestions(dateKey);
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return fallbackQuestions(dateKey);
    const parsed = JSON.parse(content) as { questions?: unknown };
    const raw = Array.isArray(parsed.questions) ? parsed.questions : [];
    const valid: QuizQuestion[] = [];
    for (const item of raw) {
      const q = item as Partial<QuizQuestion>;
      if (
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        q.options.every((o) => typeof o === "string" && o.length > 0) &&
        typeof q.correctIndex === "number" &&
        q.correctIndex >= 0 &&
        q.correctIndex <= 3
      ) {
        valid.push({
          id: `${dateKey}-${valid.length}`,
          category: typeof q.category === "string" ? q.category : "general",
          question: q.question,
          options: q.options as QuizQuestion["options"],
          correctIndex: q.correctIndex,
          explanation: typeof q.explanation === "string" ? q.explanation : "",
          scenario: q.scenario === true,
        });
      }
    }
    if (valid.length < QUESTIONS_PER_CHALLENGE) {
      const filler = fallbackQuestions(dateKey);
      for (let i = valid.length; i < QUESTIONS_PER_CHALLENGE; i++) {
        valid.push({ ...filler[i], id: `${dateKey}-${i}` });
      }
    }
    return valid.slice(0, QUESTIONS_PER_CHALLENGE);
  } catch {
    return fallbackQuestions(dateKey);
  }
}
