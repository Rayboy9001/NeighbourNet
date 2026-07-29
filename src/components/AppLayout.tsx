import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, Map, Plus, Bell, User, LogOut, MapPin, Moon, Sun, Shield } from "lucide-react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { NeighbourBot } from "@/components/NeighbourBot";


type NavItem = {
  to: "/home" | "/feed" | "/report" | "/map" | "/notifications" | "/profile";
  label: string;
  icon: typeof Home;
  primary?: boolean;
};

const NAV: NavItem[] = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/feed", label: "Feed", icon: MapPin },
  { to: "/report", label: "Report", icon: Plus, primary: true },
  { to: "/map", label: "Map", icon: Map },
  { to: "/notifications", label: "Alerts", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const { isAdmin } = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-border bg-sidebar sticky top-0 h-screen">
        <div className="px-6 py-6">
          <Link to="/home" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold shadow-lift">
              N
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">NeighbourNet</div>
              <div className="text-xs text-muted-foreground">See it. Report it. Fix it.</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-lg bg-primary shadow-card"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon className="relative h-5 w-5" />
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Link
            to="/profile"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent"
          >
            <div className="h-9 w-9 rounded-full bg-accent grid place-items-center text-sm font-semibold text-accent-foreground overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                (profile?.name?.[0] ?? "N").toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {profile?.name || "Neighbour"}
              </div>
              <div className="text-xs text-muted-foreground">
                ⭐ {profile?.points ?? 0} points
              </div>
            </div>
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-sidebar-accent rounded-lg"
            >
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
          <button
            onClick={toggle}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-sidebar-accent"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            onClick={handleSignOut}
            className="mt-1 w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-24 md:pb-0 relative">
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="md:hidden fixed top-4 right-4 z-40 h-10 w-10 grid place-items-center rounded-full border border-border bg-background/90 backdrop-blur text-foreground shadow-card"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-3xl px-4 md:px-8 py-6 md:py-10"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl">
        <div className="grid grid-cols-5 h-16">
          {NAV.filter((n) => n.to !== "/notifications").map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            if (item.primary) {
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center justify-center"
                  aria-label="Report"
                >
                  <motion.span
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="h-14 w-14 -mt-7 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-pop ring-4 ring-background"
                  >
                    <Icon className="h-6 w-6" />
                  </motion.span>
                </Link>
              );
            }
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 text-xs transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-active-dot"
                    className="absolute top-1.5 h-1 w-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <NeighbourBot />
    </div>
  );
}
