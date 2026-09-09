"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { Category, Note } from "@/lib/types";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import NoteCard from "./NoteCard";
import ComposeModal, { ComposeResult } from "./ComposeModal";
import CategoryModal, { CategoryEditResult } from "./CategoryModal";
import UndoToast from "./UndoToast";

const BUCKET = "note-images";
const SIGNED_URL_TTL = 60 * 60;

function formatJoined(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

export default function CategoryPage({
  email,
  userId,
  username,
}: {
  email: string;
  userId: string;
  username: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { profile, avatarUrl: myAvatarUrl } = useProfile(userId, email);

  const [category, setCategory] = useState<Category | null | undefined>(undefined);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const [composeOpen, setComposeOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);

  const loadCategory = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .eq("username", username)
      .maybeSingle();

    const cat = (data as Category) ?? null;
    setCategory(cat);

    const paths = [cat?.avatar_path, cat?.banner_path].filter((p): p is string => !!p);
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(paths, SIGNED_URL_TTL);
      const map: Record<string, string> = {};
      signed?.forEach((s) => {
        if (s.signedUrl && s.path) map[s.path] = s.signedUrl;
      });
      setAvatarUrl(cat?.avatar_path ? map[cat.avatar_path] ?? null : null);
      setBannerUrl(cat?.banner_path ? map[cat.banner_path] ?? null : null);
    } else {
      setAvatarUrl(null);
      setBannerUrl(null);
    }
  };

  useEffect(() => {
    loadCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  useEffect(() => {
    if (!category) return;
    setNotesLoading(true);
    supabase
      .from("notes")
      .select("*")
      .eq("category_id", category.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setNotes(data as Note[]);
        setNotesLoading(false);
      });
  }, [supabase, category]);

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

  const uploadImage = async (file: File, prefix: string) => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${prefix}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file);
    if (error) throw error;
    return path;
  };

  const addNote = async ({ content, imageFile }: ComposeResult) => {
    if (!category) return;
    let image_path: string | null = null;
    if (imageFile) image_path = await uploadImage(imageFile, "note");

    const { data, error } = await supabase
      .from("notes")
      .insert({ content, user_id: userId, category_id: category.id, image_path })
      .select()
      .single();
    if (error) throw error;
    setNotes((prev) => [data as Note, ...prev]);
  };

  const updateNote = async (note: Note, { content, imageFile, removeImage }: ComposeResult) => {
    let image_path = note.image_path;
    if (imageFile) {
      image_path = await uploadImage(imageFile, "note");
      if (note.image_path) await supabase.storage.from(BUCKET).remove([note.image_path]);
    } else if (removeImage && note.image_path) {
      await supabase.storage.from(BUCKET).remove([note.image_path]);
      image_path = null;
    }

    const { data, error } = await supabase
      .from("notes")
      .update({ content, image_path, updated_at: new Date().toISOString() })
      .eq("id", note.id)
      .select()
      .single();
    if (error) throw error;
    setNotes((prev) => prev.map((n) => (n.id === note.id ? (data as Note) : n)));
  };

  const finalizeDelete = async (note: Note) => {
    await supabase.from("notes").delete().eq("id", note.id);
    if (note.image_path) await supabase.storage.from(BUCKET).remove([note.image_path]);
  };

  const handleDelete = (note: Note) => {
    if (pendingDelete) finalizeDelete(pendingDelete);
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    setPendingDelete(note);
  };

  const handleUndo = () => {
    if (!pendingDelete) return;
    setNotes((prev) =>
      [...prev, pendingDelete].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    );
    setPendingDelete(null);
  };

  const handleExpire = () => {
    if (!pendingDelete) return;
    finalizeDelete(pendingDelete);
    setPendingDelete(null);
  };

  const handleCategorySubmit = async (result: CategoryEditResult) => {
    if (!category) return;
    let avatar_path = category.avatar_path;
    let banner_path = category.banner_path;

    if (result.avatarFile) {
      avatar_path = await uploadImage(result.avatarFile, "cat-avatar");
      if (category.avatar_path) await supabase.storage.from(BUCKET).remove([category.avatar_path]);
    }
    if (result.bannerFile) {
      banner_path = await uploadImage(result.bannerFile, "cat-banner");
      if (category.banner_path) await supabase.storage.from(BUCKET).remove([category.banner_path]);
    }

    const { error } = await supabase
      .from("categories")
      .update({
        display_name: result.display_name,
        username: result.username,
        bio: result.bio,
        avatar_path,
        banner_path,
        updated_at: new Date().toISOString(),
      })
      .eq("id", category.id);
    if (error) throw error;

    if (result.username !== category.username) {
      router.replace(`/u/${result.username}`);
    } else {
      await loadCategory();
    }
  };

  const handleCategoryDelete = async () => {
    if (!category) return;
    if (!window.confirm(`"${category.display_name}" kategorisini ve içindeki tüm notları silmek istediğine emin misin?`)) {
      return;
    }
    await supabase.from("categories").delete().eq("id", category.id);
    router.replace("/profile/following");
  };

  if (category === undefined) {
    return (
      <div className="min-h-screen">
        <MobileHeader avatarUrl={myAvatarUrl} />
        <div className="flex justify-center">
          <div className="flex w-full max-w-[1265px]">
            <Sidebar
              email={email}
              displayName={profile?.display_name ?? "Sen"}
              username={profile?.username ?? "kullanici"}
              avatarUrl={myAvatarUrl}
            />
            <main className="flex-1 min-w-0 max-w-[600px] border-x border-border px-4 py-10 text-center text-muted">
              Yükleniyor...
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (category === null) {
    return (
      <div className="min-h-screen">
        <MobileHeader avatarUrl={myAvatarUrl} />
        <div className="flex justify-center">
          <div className="flex w-full max-w-[1265px]">
            <Sidebar
              email={email}
              displayName={profile?.display_name ?? "Sen"}
              username={profile?.username ?? "kullanici"}
              avatarUrl={myAvatarUrl}
            />
            <main className="flex-1 min-w-0 max-w-[600px] border-x border-border px-4 py-10 text-center text-muted">
              Bu kategori bulunamadı.
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <MobileHeader avatarUrl={myAvatarUrl} />
      <div className="flex justify-center">
        <div className="flex w-full max-w-[1265px]">
          <Sidebar
            email={email}
            displayName={profile?.display_name ?? "Sen"}
            username={profile?.username ?? "kullanici"}
            avatarUrl={myAvatarUrl}
          />

          <main className="flex-1 min-w-0 max-w-[600px] border-x border-border">
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur flex items-center gap-6 px-4 py-2 border-b border-border">
              <Link
                href="/profile/following"
                aria-label="Geri"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-hover transition -ml-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-foreground">
                  <path d="M7.41 13.41 12 18l1.41-1.41L9.83 13H20v-2H9.83l3.58-3.59L12 6l-4.59 4.59L6 12l1.41 1.41Z" />
                </svg>
              </Link>
              <div>
                <div className="font-bold text-lg leading-tight">{category.display_name}</div>
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
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => setEditOpen(true)}
                    className="rounded-full border border-border font-bold px-4 py-1.5 text-[15px] hover:bg-hover transition"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => setComposeOpen(true)}
                    className="rounded-full bg-accent text-white font-bold px-4 py-1.5 text-[15px] hover:bg-accent/90 transition"
                  >
                    Not yaz
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <div className="font-extrabold text-xl leading-tight">{category.display_name}</div>
                <div className="text-muted">@{category.username}</div>
              </div>

              {category.bio && (
                <p className="mt-3 text-[15px] whitespace-pre-wrap break-words">{category.bio}</p>
              )}

              <div className="mt-3 flex items-center gap-1 text-muted text-[15px]">
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-muted">
                  <path d="M7 2v2H5.5A2.5 2.5 0 0 0 3 6.5v13A2.5 2.5 0 0 0 5.5 22h13a2.5 2.5 0 0 0 2.5-2.5v-13A2.5 2.5 0 0 0 18.5 4H17V2h-2v2H9V2H7Zm-2 7h14v10.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V9Z" />
                </svg>
                Katıldı: {formatJoined(category.created_at)}
              </div>

              <div className="mt-3 flex items-center gap-4 text-[15px]">
                <span>
                  <span className="font-bold">1</span> <span className="text-muted">Takip edilen</span>
                </span>
                <span>
                  <span className="font-bold">1</span> <span className="text-muted">Takipçi</span>
                </span>
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
              <div className="px-4 py-16 text-center text-muted">
                Henüz not yok. &quot;Not yaz&quot; ile ilkini ekle.
              </div>
            ) : (
              notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  displayName={category.display_name}
                  username={category.username}
                  avatarUrl={avatarUrl}
                  imageUrl={note.image_path ? imageUrls[note.image_path] ?? null : null}
                  onEdit={(n) => {
                    setEditingNote(n);
                    setComposeOpen(true);
                  }}
                  onDelete={handleDelete}
                />
              ))
            )}
          </main>
        </div>
      </div>

      {composeOpen && (
        <ComposeModal
          displayName={category.display_name}
          avatarUrl={avatarUrl}
          editingNote={editingNote}
          existingImageUrl={
            editingNote?.image_path ? imageUrls[editingNote.image_path] ?? null : null
          }
          onClose={() => {
            setComposeOpen(false);
            setEditingNote(null);
          }}
          onSubmit={(result) => (editingNote ? updateNote(editingNote, result) : addNote(result))}
        />
      )}

      {editOpen && (
        <CategoryModal
          category={category}
          avatarUrl={avatarUrl}
          bannerUrl={bannerUrl}
          onClose={() => setEditOpen(false)}
          onSubmit={handleCategorySubmit}
          onDelete={handleCategoryDelete}
        />
      )}

      {pendingDelete && (
        <UndoToast key={pendingDelete.id} onUndo={handleUndo} onExpire={handleExpire} />
      )}
    </div>
  );
}
