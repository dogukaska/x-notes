"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Category } from "@/lib/types";

const BUCKET = "note-images";
const SIGNED_URL_TTL = 60 * 60;

export function useCategories(userId: string) {
  const [supabase] = useState(() => createClient());
  const [categories, setCategories] = useState<Category[]>([]);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });

    const rows = (data as Category[]) ?? [];
    setCategories(rows);

    const paths = rows.map((c) => c.avatar_path).filter((p): p is string => !!p);
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(paths, SIGNED_URL_TTL);
      const map: Record<string, string> = {};
      signed?.forEach((s) => {
        if (s.signedUrl && s.path) map[s.path] = s.signedUrl;
      });
      setAvatarUrls(map);
    } else {
      setAvatarUrls({});
    }

    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { categories, avatarUrls, loading, reload: load };
}
