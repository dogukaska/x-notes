"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Note } from "@/lib/types";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import ComposeModal, { ComposeResult } from "./ComposeModal";
import NoteCard from "./NoteCard";
import RightPanel from "./RightPanel";
import UndoToast from "./UndoToast";

const BUCKET = "note-images";
const SIGNED_URL_TTL = 60 * 60; // 1 saat

export default function NotesApp({
  email,
  userId,
}: {
  email: string;
  userId: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);

  useEffect(() => {
    let active = true;

    supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active && data) setNotes(data as Note[]);
        if (active) setLoading(false);
      });

    const channel = supabase
      .channel("notes-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotes((prev) =>
              prev.some((n) => n.id === (payload.new as Note).id)
                ? prev
                : [payload.new as Note, ...prev]
            );
          } else if (payload.eventType === "DELETE") {
            setNotes((prev) => prev.filter((n) => n.id !== (payload.old as Note).id));
          } else if (payload.eventType === "UPDATE") {
            setNotes((prev) =>
              prev.map((n) => (n.id === (payload.new as Note).id ? (payload.new as Note) : n))
            );
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  // Görseli olan notlar için imzalı URL üret
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

  const uploadImage = async (file: File) => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file);
    if (error) throw error;
    return path;
  };

  const addNote = async ({ content, imageFile }: ComposeResult) => {
    let image_path: string | null = null;
    if (imageFile) image_path = await uploadImage(imageFile);

    const { data, error } = await supabase
      .from("notes")
      .insert({ content, user_id: userId, image_path })
      .select()
      .single();

    if (error) throw error;
    setNotes((prev) => [data as Note, ...prev.filter((n) => n.id !== (data as Note).id)]);
  };

  const updateNote = async (note: Note, { content, imageFile, removeImage }: ComposeResult) => {
    let image_path = note.image_path;

    if (imageFile) {
      image_path = await uploadImage(imageFile);
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

  const openCompose = () => {
    setEditingNote(null);
    setComposeOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setComposeOpen(true);
  };

  const filtered = query.trim()
    ? notes.filter((n) => n.content.toLowerCase().includes(query.trim().toLowerCase()))
    : notes;

  return (
    <div className="min-h-screen">
      <MobileHeader email={email} />
      <div className="flex justify-center">
      <div className="flex w-full max-w-[1265px]">
        <Sidebar email={email} onCompose={openCompose} />

        <main className="flex-1 min-w-0 max-w-[600px] border-x border-border">
          <h1 className="hidden md:block sticky top-0 z-10 bg-background/80 backdrop-blur px-4 py-3 text-xl font-bold border-b border-border">
            Notlarım
          </h1>

          {loading ? (
            <div className="px-4 py-10 text-center text-muted">Yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-16 text-center text-muted">
              {query ? "Eşleşen not bulunamadı." : "Henüz not yok. Sağdaki / üstteki butonla ilk notunu yaz."}
            </div>
          ) : (
            filtered.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                email={email}
                imageUrl={note.image_path ? imageUrls[note.image_path] ?? null : null}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </main>

        <RightPanel query={query} onQueryChange={setQuery} total={notes.length} />
      </div>
      </div>

      {/* Mobil: yüzen not yazma butonu */}
      <button
        onClick={openCompose}
        aria-label="Not yaz"
        className="md:hidden fixed bottom-6 right-4 w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center shadow-lg hover:bg-accent/90 transition"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M12 4v16m-8-8h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      </button>

      {composeOpen && (
        <ComposeModal
          email={email}
          editingNote={editingNote}
          existingImageUrl={
            editingNote?.image_path ? imageUrls[editingNote.image_path] ?? null : null
          }
          onClose={() => setComposeOpen(false)}
          onSubmit={(result) => (editingNote ? updateNote(editingNote, result) : addNote(result))}
        />
      )}

      {pendingDelete && (
        <UndoToast key={pendingDelete.id} onUndo={handleUndo} onExpire={handleExpire} />
      )}
    </div>
  );
}
