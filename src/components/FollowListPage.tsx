"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCategories } from "@/lib/useCategories";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import { useProfile } from "@/lib/useProfile";
import CategoryModal, { CategoryEditResult } from "./CategoryModal";

const BUCKET = "note-images";

export default function FollowListPage({
  email,
  userId,
  title,
}: {
  email: string;
  userId: string;
  title: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const { profile, avatarUrl } = useProfile(userId, email);
  const { categories, avatarUrls, loading, reload } = useCategories(userId);
  const [createOpen, setCreateOpen] = useState(false);

  const uploadImage = async (file: File, prefix: string) => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${prefix}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file);
    if (error) throw error;
    return path;
  };

  const handleCreate = async (result: CategoryEditResult) => {
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .eq("username", result.username)
      .maybeSingle();
    if (existing) throw new Error("Bu kullanıcı adı zaten kullanılıyor");

    let avatar_path: string | null = null;
    let banner_path: string | null = null;
    if (result.avatarFile) avatar_path = await uploadImage(result.avatarFile, "cat-avatar");
    if (result.bannerFile) banner_path = await uploadImage(result.bannerFile, "cat-banner");

    const { error } = await supabase.from("categories").insert({
      user_id: userId,
      display_name: result.display_name,
      username: result.username,
      bio: result.bio,
      avatar_path,
      banner_path,
    });
    if (error) throw error;
    await reload();
  };

  return (
    <div className="min-h-screen">
      <MobileHeader displayName={profile?.display_name ?? "Sen"} avatarUrl={avatarUrl} />
      <div className="flex justify-center">
        <div className="flex w-full max-w-[1265px]">
          <Sidebar
            email={email}
            displayName={profile?.display_name ?? "Sen"}
            username={profile?.username ?? "kullanici"}
            avatarUrl={avatarUrl}
          />

          <main className="flex-1 min-w-0 max-w-[600px] border-x border-border">
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur flex items-center gap-6 px-4 py-2 border-b border-border">
              <Link
                href="/profile"
                aria-label="Geri"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-hover transition -ml-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-foreground">
                  <path d="M7.41 13.41 12 18l1.41-1.41L9.83 13H20v-2H9.83l3.58-3.59L12 6l-4.59 4.59L6 12l1.41 1.41Z" />
                </svg>
              </Link>
              <div>
                <div className="font-bold text-lg leading-tight">{title}</div>
                <div className="text-xs text-muted">@{profile?.username}</div>
              </div>
              <button
                onClick={() => setCreateOpen(true)}
                className="ml-auto rounded-full bg-accent text-white font-bold px-4 py-1.5 text-[14px] hover:bg-accent/90 transition"
              >
                Yeni kategori
              </button>
            </div>

            {loading ? (
              <div className="px-4 py-10 text-center text-muted">Yükleniyor...</div>
            ) : categories.length === 0 ? (
              <div className="px-4 py-16 text-center text-muted">
                Henüz kategori yok. Sağ üstteki butonla ilkini oluştur.
              </div>
            ) : (
              categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/u/${c.username}`}
                  className="flex gap-3 px-4 py-3 border-b border-border hover:bg-hover/40 transition"
                >
                  {c.avatar_path && avatarUrls[c.avatar_path] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrls[c.avatar_path]}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="w-12 h-12 rounded-full bg-accent flex items-center justify-center font-bold text-white shrink-0 text-lg">
                      {c.display_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold truncate">{c.display_name}</div>
                    <div className="text-muted text-sm truncate">@{c.username}</div>
                    {c.bio && (
                      <div className="text-sm mt-0.5 line-clamp-2 whitespace-pre-wrap break-words">
                        {c.bio}
                      </div>
                    )}
                  </div>
                </Link>
              ))
            )}
          </main>
        </div>
      </div>

      {createOpen && (
        <CategoryModal
          category={null}
          avatarUrl={null}
          bannerUrl={null}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
