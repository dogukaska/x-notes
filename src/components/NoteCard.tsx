"use client";

import { Note } from "@/lib/types";
import { formatRelativeTime } from "@/lib/formatTime";

export default function NoteCard({
  note,
  email,
  imageUrl,
  onEdit,
  onDelete,
}: {
  note: Note;
  email: string;
  imageUrl: string | null;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}) {
  const initial = email.charAt(0).toUpperCase();
  const edited = note.updated_at !== note.created_at;

  return (
    <article className="flex gap-3 px-4 py-3 border-b border-border hover:bg-hover/40 transition group">
      <span className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-white shrink-0">
        {initial}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-[15px]">
          <span className="font-bold truncate">Sen</span>
          <span className="text-muted">
            · {formatRelativeTime(note.created_at)}
            {edited && " · düzenlendi"}
          </span>
          <div className="ml-auto flex items-center opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => onEdit(note)}
              aria-label="Notu düzenle"
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-accent hover:bg-accent/10 transition"
            >
              <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] fill-current">
                <path d="M20.66 4.24a2.5 2.5 0 0 0-3.53 0l-11.9 11.9-1.7 5.24 5.24-1.7 11.9-11.9a2.5 2.5 0 0 0 0-3.54Zm-13.3 13.3-1.65.54.55-1.65 9.9-9.9 1.1 1.1-9.9 9.9Z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(note)}
              aria-label="Notu sil"
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-500/10 transition"
            >
              <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] fill-current">
                <path d="M16 6V4.5C16 3.12 14.88 2 13.5 2h-3C9.11 2 8 3.12 8 4.5V6H3v2h1.06l.81 11.21C4.98 20.78 6.28 22 7.86 22h8.27c1.58 0 2.88-1.22 3-2.79L19.93 8H21V6h-5Zm-6-1.5c0-.28.22-.5.5-.5h3c.27 0 .5.22.5.5V6h-4V4.5ZM17.13 19.06c-.04.5-.47.94-1 .94H7.86c-.53 0-.96-.44-1-.94L6.07 8h11.85l-.79 11.06ZM10 10v7h-1.5v-7H10Zm3.5 0v7H12v-7h1.5Z" />
              </svg>
            </button>
          </div>
        </div>
        {note.content && (
          <p className="text-[15px] whitespace-pre-wrap break-words mt-0.5">
            {note.content}
          </p>
        )}
        {imageUrl && (
          <div className="mt-2 rounded-2xl overflow-hidden border border-border w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="max-h-[500px] object-contain" />
          </div>
        )}
      </div>
    </article>
  );
}
