import { Suspense, lazy, useState } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const NeighbourBot = lazy(() =>
  import("@/components/NeighbourBot").then((m) => ({ default: m.NeighbourBot })),
);

/**
 * The assistant (and its chat bundle) is only downloaded once the user taps the
 * launcher, keeping the initial page load light.
 */
export function LazyNeighbourBot() {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <Suspense fallback={<Launcher pulse />}>
        <NeighbourBot initialOpen />
      </Suspense>
    );
  }

  return <Launcher onClick={() => setLoaded(true)} />;
}

function Launcher({ onClick, pulse }: { onClick?: () => void; pulse?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open NeighbourBot"
      className={cn(
        "fixed z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-pop ring-4 ring-background transition-transform hover:scale-105 active:scale-95",
        "bottom-20 right-4 md:bottom-6 md:right-6",
        pulse && "animate-pulse",
      )}
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}
