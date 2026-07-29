import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — NeighbourNet" },
      { name: "description", content: "Sign in to NeighbourNet with just a name and password." },
      { property: "og:title", content: "Sign in — NeighbourNet" },
      { property: "og:description", content: "Simple name + password access." },
    ],
  }),
  component: AuthPage,
});

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function nameToEmail(name: string) {
  const slug = slugify(name);
  return `${slug}@neighbournet.local`;
}

function AuthPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && !data.user.is_anonymous) {
        navigate({ to: "/home", replace: true });
      }
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Please enter a name (at least 2 characters).");
      return;
    }
    if (!slugify(trimmed)) {
      toast.error("Name must contain letters or numbers.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    const email = nameToEmail(trimmed);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: trimmed } },
        });
        if (error) {
          if (/registered|exists/i.test(error.message)) {
            toast.error("That name is taken. Try signing in instead.");
            setMode("signin");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success(`Welcome, ${trimmed}!`);
        navigate({ to: "/home", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error("Wrong name or password.");
          return;
        }
        toast.success(`Welcome back, ${trimmed}!`);
        navigate({ to: "/home", replace: true });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background grid place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lift p-8"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold">
            N
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">NeighbourNet</div>
            <div className="text-xs text-muted-foreground">
              {mode === "signup" ? "Create your neighbour account" : "Welcome back"}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              autoComplete="username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Doe"
              className="mt-1 w-full h-11 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="mt-1 w-full h-11 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
              minLength={6}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={busy}
            type="submit"
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold shadow-card disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </motion.button>
        </form>

        <div className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-primary font-medium hover:underline"
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          No email required — just a name and a password you'll remember.
        </p>
      </motion.div>
    </div>
  );
}
