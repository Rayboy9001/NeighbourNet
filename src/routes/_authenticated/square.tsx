import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquare, Users, ArrowRight, Plus } from "lucide-react";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { fetchSquares, fetchMemberCounts, fetchMyMemberships } from "@/lib/square.client";
import { joinSquareRoom } from "@/lib/square.functions";
import { useIsAdmin } from "@/hooks/use-is-admin";
import type { Square, SquareMember } from "@/lib/square";

export const Route = createFileRoute("/_authenticated/square")({
  head: () => ({
    meta: [
      { title: "Neighbourhood Square · NeighbourNet" },
      { name: "description", content: "Join moderated neighbourhood discussions." },
    ],
  }),
  component: SquareDiscoveryPage,
});

function SquareDiscoveryPage() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const { isAdmin } = useIsAdmin(user?.id);
  const [squares, setSquares] = useState<Square[]>([]);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [memberships, setMemberships] = useState<Map<string, SquareMember>>(new Map());
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const joinSquare = useServerFn(joinSquareRoom);

  useEffect(() => {
    async function load() {
      const [sq, mems] = await Promise.all([
        fetchSquares(),
        user ? fetchMyMemberships(user.id) : Promise.resolve([]),
      ]);
      setSquares(sq);
      setCounts(await fetchMemberCounts(sq.map((s) => s.id)));
      setMemberships(new Map(mems.map((m) => [m.square_id, m])));
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleJoin(squareId: string) {
    setJoining(squareId);
    try {
      await joinSquare({ data: { squareId } });
      if (!user) return;
      const mems = await fetchMyMemberships(user.id);
      setMemberships(new Map(mems.map((m) => [m.square_id, m])));
    } finally {
      setJoining(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-primary" /> Neighbourhood Square
        </h1>
        <p className="mt-1 text-muted-foreground">
          Moderated local chat rooms for your community.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : squares.length === 0 ? (
        <EmptyState isAdmin={isAdmin} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {squares.map((square, idx) => {
            const member = memberships.get(square.id);
            const count = counts.get(square.id) ?? 0;
            const full = count >= square.max_participants;
            return (
              <motion.div
                key={square.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 28 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-card hover:border-primary/25"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{square.emoji}</span>
                    <div>
                      <h2 className="font-semibold text-lg">{square.name}</h2>
                      <div className="text-xs text-muted-foreground">{square.area_label}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background border border-border rounded-full px-2 py-1">
                    <Users className="h-3 w-3" /> {count}/{square.max_participants}
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                  {square.description}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  {member ? (
                    <Link
                      to="/square/$slug"
                      params={{ slug: square.slug }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium transition-transform active:scale-95"
                    >
                      Enter chat <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : full ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted text-muted-foreground px-4 py-2 text-sm font-medium">
                      Full
                    </span>
                  ) : (
                    <button
                      onClick={() => handleJoin(square.id)}
                      disabled={!!joining}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium transition-transform active:scale-95 disabled:opacity-60"
                    >
                      {joining === square.id ? "Joining..." : "Join square"}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {isAdmin && !loading && (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center">
          <div className="text-sm text-muted-foreground">
            Admins can create new neighbourhood squares from the admin dashboard.
          </div>
          <Link
            to="/admin"
            className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
          >
            Open admin →
          </Link>
        </div>
      )}
    </div>
  );
}

function EmptyState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <div className="text-4xl mb-3">🏘️</div>
      <h3 className="font-semibold text-lg">No squares nearby yet</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
        Neighbourhood Squares are local discussion rooms. Check back soon or ask an admin to create one for your area.
      </p>
      {isAdmin && (
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 mt-5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Create square
        </Link>
      )}
    </div>
  );
}
