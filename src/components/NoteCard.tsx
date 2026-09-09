"use client";

import { useState } from "react";
import { Note } from "@/lib/types";
import { formatRelativeTime } from "@/lib/formatTime";

export default function NoteCard({
  note,
  email,
  onDelete,
}: {
  note: Note;
  email: string;
  onDelete: (id: string) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const initial = email.charAt(0).toUpperCase();

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await onDelete(note.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <article className="flex gap-3 px-4 py-3 border-b border-border hover:bg-hover/40 transition group">
      <span className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-white shrink-0">
        {initial}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-[15px]">
          <span className="font-bold truncate">Sen</span>
          <span className="text-muted">· {formatRelativeTime(note.created_at)}</span>
          <div className="ml-auto opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Notu sil"
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-500/10 transition"
            >
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                <path d="M16 6V4.5C16 3.12 14.88 2 13.5 2h-3C9.11 2 8 3.12 8 4.5V6H3v2h1.06l.81 11.21C4.98 20.78 6.28 22 7.86 22h8.27c1.58 0 2.88-1.22 3-2.79L19.93 8H21V6h-5Zm-6-1.5c0-.28.22-.5.5-.5h3c.27 0 .5.22.5.5V6h-4V4.5ZM17.13 19.06c-.04.5-.47.94-1 .94H7.86c-.53 0-.96-.44-1-.94L6.07 8h11.85l-.79 11.06ZM10 10v7h-1.5v-7H10Zm3.5 0v7H12v-7h1.5Z" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-[15px] whitespace-pre-wrap break-words mt-0.5">
          {note.content}
        </p>
      </div>
    </article>
  );
}
