"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";

const BUCKET = "note-images";
const SIGNED_URL_TTL = 60 * 60;

function defaultUsername(email: string) {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function useProfile(userId: string, email: string) {
  const [supabase] = useState(() => createClient());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    let row = data as Profile | null;

    if (!row) {
      const { data: created } = await supabase
        .from("profiles")
        .insert({
          user_id: userId,
          display_name: email.split("@")[0],
          username: defaultUsername(email) || "kullanici",
        })
        .select()
        .single();
      row = created as Profile;
    }

    setProfile(row);

    const paths = [row?.avatar_path, row?.banner_path].filter(
      (p): p is string => !!p
    );
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(paths, SIGNED_URL_TTL);
      const map: Record<string, string> = {};
      signed?.forEach((s) => {
        if (s.signedUrl && s.path) map[s.path] = s.signedUrl;
      });
      setAvatarUrl(row?.avatar_path ? map[row.avatar_path] ?? null : null);
      setBannerUrl(row?.banner_path ? map[row.banner_path] ?? null : null);
    } else {
      setAvatarUrl(null);
      setBannerUrl(null);
    }

    setLoading(false);
  }, [supabase, userId, email]);

  useEffect(() => {
    load();
  }, [load]);

  return { profile, avatarUrl, bannerUrl, loading, reload: load };
}
