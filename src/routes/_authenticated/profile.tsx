import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Award, Star, ClipboardList, ThumbsUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { formatPoints, usePoints } from "@/hooks/use-points";
import { fetchReports, type ReportWithMeta } from "@/lib/reports";
import { ReportCard } from "@/components/ReportCard";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile · NeighbourNet" },
      { name: "description", content: "Your reports, points and achievements." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { profile, setProfile } = useProfile(user?.id);
  const { points } = usePoints(user?.id);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [reports, setReports] = useState<ReportWithMeta[]>([]);
  const [confirmCount, setConfirmCount] = useState(0);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBio(profile.bio ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    fetchReports({ userId: user.id }).then(setReports);
    supabase
      .from("confirmations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => setConfirmCount(count ?? 0));
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("profiles")
      .update({ name: name.trim(), bio: bio.trim() })
      .eq("id", user.id)
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    setProfile(data as typeof profile);
    toast.success("Profile updated");
  }

  const badges = [
    reports.length >= 1 && { icon: "🌱", label: "First Reporter" },
    confirmCount >= 5 && { icon: "🤝", label: "Helpful Neighbour" },
    reports.length >= 5 && { icon: "🛠", label: "Problem Solver" },
    points >= 100 && { icon: "🏅", label: "Community Champion" },
  ].filter(Boolean) as { icon: string; label: string }[];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-3xl p-6 md:p-8 shadow-lift">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary-foreground/20 grid place-items-center text-2xl font-bold overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              (profile?.name?.[0] ?? "N").toUpperCase()
            )}
          </div>
          <div>
            <div className="text-xl font-bold">{profile?.name || "Neighbour"}</div>
            <div className="text-sm opacity-80">{user?.email}</div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <Stat icon={Star} value={formatPoints(points)} label="Community Points" />
          <Stat icon={ClipboardList} value={String(reports.length)} label="Reports" />
          <Stat icon={ThumbsUp} value={String(confirmCount)} label="Confirmed" />
        </div>
      </div>

      {badges.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Achievements</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-full text-sm"
              >
                <span className="text-lg">{b.icon}</span> {b.label}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold">Edit profile</h2>
        <div>
          <label className="text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={300}
            rows={3}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </section>

      <section>
        <h2 className="font-semibold mb-3">My reports</h2>
        {reports.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-6 text-center text-sm text-muted-foreground">
            You haven't reported anything yet.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Star;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-primary-foreground/10 rounded-xl p-3">
      <Icon className="h-4 w-4 opacity-80" />
      <div className="mt-1 text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  );
}
