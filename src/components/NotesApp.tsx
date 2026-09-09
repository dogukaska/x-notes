"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Note } from "@/lib/types";
import Sidebar from "./Sidebar";
import ComposeBox from "./ComposeBox";
import NoteCard from "./NoteCard";
import RightPanel from "./RightPanel";

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
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const addNote = async (content: string) => {
    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: Note = {
      id: optimisticId,
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
    };
    setNotes((prev) => [optimistic, ...prev]);

    const { data, error } = await supabase
      .from("notes")
      .insert({ content, user_id: userId })
      .select()
      .single();

    if (error) {
      setNotes((prev) => prev.filter((n) => n.id !== optimisticId));
      throw error;
    }
    setNotes((prev) => [data as Note, ...prev.filter((n) => n.id !== optimisticId)]);
  };

  const deleteNote = async (id: string) => {
    const prev = notes;
    setNotes((p) => p.filter((n) => n.id !== id));
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      setNotes(prev);
      throw error;
    }
  };

  const filtered = query.trim()
    ? notes.filter((n) => n.content.toLowerCase().includes(query.trim().toLowerCase()))
    : notes;

  return (
    <div className="flex justify-center min-h-screen">
      <div className="flex w-full max-w-[1265px]">
        <Sidebar email={email} />

        <main className="flex-1 min-w-0 max-w-[600px] border-x border-border">
          <h1 className="hidden md:block sticky top-0 z-10 bg-background/80 backdrop-blur px-4 py-3 text-xl font-bold border-b border-border">
            Notlarım
          </h1>

          <ComposeBox email={email} onSubmit={addNote} />

          {loading ? (
            <div className="px-4 py-10 text-center text-muted">Yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-16 text-center text-muted">
              {query ? "Eşleşen not bulunamadı." : "Henüz not yok. İlk notunu yaz!"}
            </div>
          ) : (
            filtered.map((note) => (
              <NoteCard key={note.id} note={note} email={email} onDelete={deleteNote} />
            ))
          )}
        </main>

        <RightPanel query={query} onQueryChange={setQuery} total={notes.length} />
      </div>
    </div>
  );
}
