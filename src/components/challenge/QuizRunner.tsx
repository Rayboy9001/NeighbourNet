import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  QUESTION_SECONDS,
  BASE_POINTS,
  categoryMeta,
  speedBonus,
  type QuizQuestion,
} from "@/lib/challenge";

export type Answer = { selected: number | null; remainingMs: number };

const TOTAL_MS = QUESTION_SECONDS * 1000;

function CircularTimer({ progress, seconds }: { progress: number; seconds: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const urgent = seconds <= 5;
  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90">
        <circle cx="22" cy="22" r={r} className="stroke-muted" strokeWidth="4" fill="none" />
        <circle
          cx="22"
          cy="22"
          r={r}
          className={cn("transition-colors", urgent ? "stroke-destructive" : "stroke-primary")}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
        />
      </svg>
      <motion.span
        animate={urgent ? { scale: [1, 1.15, 1] } : { scale: 1 }}
        transition={{ duration: 0.6, repeat: urgent ? Infinity : 0 }}
        className={cn(
          "absolute inset-0 grid place-items-center text-sm font-semibold tabular-nums",
          urgent ? "text-destructive" : "text-foreground",
        )}
      >
        {seconds}
      </motion.span>
    </div>
  );
}

export function QuizRunner({
  questions,
  onFinish,
}: {
  questions: QuizQuestion[];
  onFinish: (answers: Answer[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(TOTAL_MS);
  const [locked, setLocked] = useState(false);
  const startRef = useRef(Date.now());
  const answersRef = useRef<Answer[]>([]);

  const question = questions[index];
  const meta = categoryMeta(question?.category ?? "general");

  const commit = useCallback(
    (choice: number | null, remainingMs: number) => {
      setLocked(true);
      setSelected(choice);
      const answer: Answer = { selected: choice, remainingMs };
      answersRef.current = [...answersRef.current, answer];
      setAnswers(answersRef.current);
    },
    [],
  );

  useEffect(() => {
    if (locked) return;
    const id = window.setInterval(() => {
      const left = TOTAL_MS - (Date.now() - startRef.current);
      if (left <= 0) {
        setRemaining(0);
        commit(null, 0);
      } else {
        setRemaining(left);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [locked, commit]);

  useEffect(() => {
    if (!locked) return;
    const id = window.setTimeout(() => {
      if (index + 1 >= questions.length) {
        onFinish(answersRef.current);
        return;
      }
      setIndex((i) => i + 1);
      setSelected(null);
      setLocked(false);
      setRemaining(TOTAL_MS);
      startRef.current = Date.now();
    }, 2200);
    return () => window.clearTimeout(id);
  }, [locked, index, questions.length, onFinish]);

  const runningScore = useMemo(
    () =>
      answers.reduce((sum, a, i) => {
        const q = questions[i];
        if (q && a.selected === q.correctIndex) {
          return sum + BASE_POINTS + speedBonus(a.remainingMs);
        }
        return sum;
      }, 0),
    [answers, questions],
  );

  if (!question) return null;

  const correct = selected !== null && selected === question.correctIndex;
  const seconds = Math.max(0, Math.ceil(remaining / 1000));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <CircularTimer progress={remaining / TOTAL_MS} seconds={seconds} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>
              Question {index + 1} / {questions.length}
            </span>
            <span className="font-semibold text-foreground tabular-nums">{runningScore} pts</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: `${((index + (locked ? 1 : 0)) / questions.length) * 100}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, rotateY: -12, y: 16 }}
          animate={{ opacity: 1, rotateY: 0, y: 0 }}
          exit={{ opacity: 0, rotateY: 12, y: -16 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          style={{ transformPerspective: 1000 }}
          className="rounded-2xl border border-border bg-card p-5 shadow-card"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
            <span className="rounded-full bg-accent px-2.5 py-1 text-accent-foreground">
              {meta.emoji} {meta.label}
            </span>
            {question.scenario && (
              <span className="rounded-full border border-border px-2.5 py-1">Neighbour scenario</span>
            )}
          </div>

          <h2 className="text-lg md:text-xl font-semibold leading-snug mb-4">{question.question}</h2>

          <div className="grid gap-2.5">
            {question.options.map((option, i) => {
              const isCorrect = i === question.correctIndex;
              const isChosen = selected === i;
              return (
                <motion.button
                  key={i}
                  type="button"
                  disabled={locked}
                  whileHover={locked ? undefined : { y: -2 }}
                  whileTap={locked ? undefined : { scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 500, damping: 26 }}
                  onClick={() => commit(i, Math.max(0, remaining))}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 text-start text-sm font-medium transition-colors",
                    !locked && "border-border bg-background hover:border-primary/60 hover:bg-accent",
                    locked && isCorrect && "border-primary bg-primary/10 text-foreground",
                    locked && isChosen && !isCorrect && "border-destructive bg-destructive/10",
                    locked && !isCorrect && !isChosen && "border-border opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "h-6 w-6 shrink-0 grid place-items-center rounded-full border text-xs font-semibold",
                      locked && isCorrect
                        ? "border-primary bg-primary text-primary-foreground"
                        : locked && isChosen
                          ? "border-destructive bg-destructive text-destructive-foreground"
                          : "border-border",
                    )}
                  >
                    {locked && isCorrect ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : locked && isChosen ? (
                      <X className="h-3.5 w-3.5" />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  <span className="flex-1">{option}</span>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {locked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 rounded-xl bg-muted/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-1">
                    {correct ? (
                      <>
                        <Check className="h-4 w-4 text-primary" /> Correct
                        <span className="ms-auto flex items-center gap-1 text-xs text-muted-foreground">
                          <Zap className="h-3.5 w-3.5" /> +{BASE_POINTS + speedBonus(remaining)} pts
                        </span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-destructive" />
                        {selected === null ? "Time's up" : "Not quite"}
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {question.explanation}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
