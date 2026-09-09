"use client";

import { useRef, useState } from "react";

const MAX_LEN = 2000;

export default function ComposeBox({
  email,
  onSubmit,
}: {
  email: string;
  onSubmit: (content: string) => Promise<void>;
}) {
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initial = email.charAt(0).toUpperCase();

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    try {
      await onSubmit(trimmed);
      setContent("");
      requestAnimationFrame(resize);
    } finally {
      setPosting(false);
    }
  };

  const remaining = MAX_LEN - content.length;

  return (
    <div className="flex gap-3 px-4 py-3 border-b border-border">
      <span className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-white shrink-0">
        {initial}
      </span>
      <div className="flex-1 flex flex-col">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            if (e.target.value.length <= MAX_LEN) setContent(e.target.value);
            resize();
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit();
          }}
          placeholder="Aklından ne geçiyor?"
          rows={1}
          className="w-full bg-transparent text-xl placeholder:text-muted resize-none py-2 min-h-[52px] max-h-[400px]"
        />
        <div className="flex items-center justify-end gap-3 mt-2 pt-3 border-t border-border">
          {content.length > 0 && (
            <span
              className={`text-xs ${remaining < 0 ? "text-red-500" : "text-muted"}`}
            >
              {remaining}
            </span>
          )}
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || posting || remaining < 0}
            className="rounded-full bg-accent text-white font-bold px-5 py-2 text-[15px] disabled:opacity-50 hover:bg-accent/90 transition"
          >
            {posting ? "Paylaşılıyor..." : "Paylaş"}
          </button>
        </div>
      </div>
    </div>
  );
}
