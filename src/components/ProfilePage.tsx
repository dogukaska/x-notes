"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { useCategories } from "@/lib/useCategories";
import { Note } from "@/lib/types";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import NoteCard from "./NoteCard";
import EditProfileModal, { ProfileEditResult } from "./EditProfileModal";

const BUCKET = "note-images";
const SIGNED_URL_TTL = 60 * 60;

function formatJoined(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

export default function ProfilePage({
  email,
  userId,
  joinedAt,
}: {
  email: string;
  userId: string;
  joinedAt: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const { profile, avatarUrl, bannerUrl, loading, reload } = useProfile(userId, email);
  const { categories } = useCategories(userId);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("notes")
      .select("*")
      .is("category_id", null)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setNotes(data as Note[]);
        setNotesLoading(false);
      });
  }, [supabase, userId]);

  useEffect(() => {
    const missing = notes
      .map((n) => n.image_path)
      .filter((p): p is string => !!p && !imageUrls[p]);
    if (missing.length === 0) return;

    supabase.storage
      .from(BUCKET)
      .createSignedUrls(missing, SIGNED_URL_TTL)
      .then(({ data }) => {
        if (!data) return;
        setImageUrls((prev) => {
          const next = { ...prev };
          for (const item of data) {
            if (item.signedUrl && item.path) next[item.path] = item.signedUrl;
          }
          return next;
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  const uploadProfileImage = async (file: File, prefix: "avatar" | "banner") => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${prefix}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file);
    if (error) throw error;
    return path;
  };

  const handleProfileSubmit = async (result: ProfileEditResult) => {
    if (!profile) return;
    let avatar_path = profile.avatar_path;
    let banner_path = profile.banner_path;

    if (result.avatarFile) {
      avatar_path = await uploadProfileImage(result.avatarFile, "avatar");
      if (profile.avatar_path) await supabase.storage.from(BUCKET).remove([profile.avatar_path]);
    }
    if (result.bannerFile) {
      banner_path = await uploadProfileImage(result.bannerFile, "banner");
      if (profile.banner_path) await supabase.storage.from(BUCKET).remove([profile.banner_path]);
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: result.display_name,
        username: result.username,
        bio: result.bio,
        avatar_path,
        banner_path,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) throw error;
    await reload();
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen">
        <MobileHeader avatarUrl={null} />
        <div className="flex justify-center">
          <div className="flex w-full max-w-[1265px]">
            <Sidebar
              email={email}
              displayName="Sen"
              username="kullanici"
              avatarUrl={null}
            />
            <main className="flex-1 min-w-0 max-w-[600px] border-x border-border px-4 py-10 text-center text-muted">
              Yükleniyor...
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <MobileHeader avatarUrl={avatarUrl} />
      <div className="flex justify-center">
        <div className="flex w-full max-w-[1265px]">
          <Sidebar
            email={email}
            displayName={profile.display_name}
            username={profile.username}
            avatarUrl={avatarUrl}
          />

          <main className="flex-1 min-w-0 max-w-[600px] border-x border-border">
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur flex items-center gap-6 px-4 py-2 border-b border-border">
              <Link
                href="/"
                aria-label="Geri"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-hover transition -ml-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-foreground">
                  <path d="M7.41 13.41 12 18l1.41-1.41L9.83 13H20v-2H9.83l3.58-3.59L12 6l-4.59 4.59L6 12l1.41 1.41Z" />
                </svg>
              </Link>
              <div>
                <div className="font-bold text-lg leading-tight">{profile.display_name}</div>
                <div className="text-xs text-muted">{notes.length} not</div>
              </div>
            </div>

            <div className="relative h-[150px] bg-background">
              {bannerUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
              )}
            </div>

            <div className="px-4">
              <div className="flex items-start justify-between">
                <div className="w-24 h-24 -mt-12 rounded-full border-4 border-background bg-hover overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl ?? "/logo.png"}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => setEditOpen(true)}
                  className="mt-3 rounded-full border border-border font-bold px-4 py-1.5 text-[15px] hover:bg-hover transition"
                >
                  Profili düzenle
                </button>
              </div>

              <div className="mt-3">
                <div className="font-extrabold text-xl leading-tight">{profile.display_name}</div>
                <div className="text-muted">@{profile.username}</div>
              </div>

              {profile.bio && (
                <p className="mt-3 text-[15px] whitespace-pre-wrap break-words">{profile.bio}</p>
              )}

              <div className="mt-3 flex items-center gap-1 text-muted text-[15px]">
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-muted">
                  <path d="M7 2v2H5.5A2.5 2.5 0 0 0 3 6.5v13A2.5 2.5 0 0 0 5.5 22h13a2.5 2.5 0 0 0 2.5-2.5v-13A2.5 2.5 0 0 0 18.5 4H17V2h-2v2H9V2H7Zm-2 7h14v10.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V9Z" />
                </svg>
                Katıldı: {formatJoined(joinedAt)}
              </div>

              <div className="mt-3 flex items-center gap-4 text-[15px]">
                <Link href="/profile/following" className="hover:underline">
                  <span className="font-bold">{categories.length}</span>{" "}
                  <span className="text-muted">Takip edilen</span>
                </Link>
                <Link href="/profile/followers" className="hover:underline">
                  <span className="font-bold">{categories.length}</span>{" "}
                  <span className="text-muted">Takipçi</span>
                </Link>
              </div>

              <div className="mt-3 pb-3 border-b border-border" />
            </div>

            <div className="flex border-b border-border">
              <div className="flex-1 text-center py-4 font-bold text-[15px] border-b-4 border-accent">
                Notlar
              </div>
            </div>

            {notesLoading ? (
              <div className="px-4 py-10 text-center text-muted">Yükleniyor...</div>
            ) : notes.length === 0 ? (
              <div className="px-4 py-16 text-center text-muted">Henüz not yok.</div>
            ) : (
              notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  displayName={profile.display_name}
                  username={profile.username}
                  avatarUrl={avatarUrl}
                  imageUrl={note.image_path ? imageUrls[note.image_path] ?? null : null}
                />
              ))
            )}
          </main>
        </div>
      </div>

      {editOpen && (
        <EditProfileModal
          profile={profile}
          avatarUrl={avatarUrl}
          bannerUrl={bannerUrl}
          onClose={() => setEditOpen(false)}
          onSubmit={handleProfileSubmit}
        />
      )}
    </div>
  );
}
