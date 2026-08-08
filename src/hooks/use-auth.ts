import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  /** Single source of truth for Community Points. */
  community_points: number;
}


export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}

export function useProfile(userId: string | null | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("profiles")
      .select("id,name,avatar_url,bio,community_points")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setProfile((data as Profile | null) ?? null);
        setLoading(false);
      });
  }, [userId]);

  return { profile, loading, setProfile };
}
