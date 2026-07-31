import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const COLORS = ["bg-primary", "bg-accent-foreground", "bg-destructive", "bg-foreground"];

export function Confetti({ count = 40 }: { count?: number }) {
  const [show, setShow] = useState(true);
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.4,
        rotate: Math.random() * 720 - 360,
        drift: Math.random() * 80 - 40,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 6,
      })),
    [count],
  );

  useEffect(() => {
    const id = window.setTimeout(() => setShow(false), 3500);
    return () => window.clearTimeout(id);
  }, []);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -40, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: "105vh", x: `calc(${p.x}vw + ${p.drift}px)`, rotate: p.rotate, opacity: 0 }}
          transition={{ duration: 2.4 + Math.random(), delay: p.delay, ease: "easeIn" }}
          className={`absolute top-0 rounded-[2px] ${p.color}`}
          style={{ width: p.size, height: p.size * 1.6 }}
        />
      ))}
    </div>
  );
}
