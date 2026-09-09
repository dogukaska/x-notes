"use client";

import { useEffect, useRef, useState } from "react";
import { Note } from "@/lib/types";

const MAX_LEN = 2000;

export type ComposeResult = {
  content: string;
  imageFile: File | null;
  removeImage: boolean;
};

export default function ComposeModal({
  displayName,
  avatarUrl,
  editingNote,
  existingImageUrl,
  onClose,
  onSubmit,
}: {
  displayName: string;
  avatarUrl: string | null;
  editingNote: Note | null;
  existingImageUrl: string | null;
  onClose: () => void;
  onSubmit: (result: ComposeResult) => Promise<void>;
}) {
  const [content, setContent] = useState(editingNote?.content ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initial = displayName.charAt(0).toUpperCase();
  const isEdit = !!editingNote;

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleFilePick = (file: File | undefined) => {
    if (!file) return;
    setImageFile(file);
    setImageRemoved(false);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const remaining = MAX_LEN - content.length;
  const canSubmit =
    (content.trim().length > 0 || previewUrl) && remaining >= 0 && !posting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setPosting(true);
    try {
      await onSubmit({ content: content.trim(), imageFile, removeImage: imageRemoved });
      onClose();
    } finally {
      setPosting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-2 pt-0 sm:pt-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[600px] bg-background border border-border rounded-none sm:rounded-2xl min-h-screen sm:min-h-0 flex flex-col">
        <div className="flex items-center px-3 py-2">
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-hover transition"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-foreground">
              <path d="M18.3 5.71 12 12l6.3 6.29-1.42 1.42L10.59 13.4 4.3 19.7 2.88 18.3 9.17 12 2.88 5.71 4.3 4.29l6.29 6.3 6.29-6.3z" />
            </svg>
          </button>
        </div>

        <div className="flex gap-3 px-4 pb-4 flex-1">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <span className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-white shrink-0">
              {initial}
            </span>
          )}
          <div className="flex-1 flex flex-col min-w-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                if (e.target.value.length <= MAX_LEN) setContent(e.target.value);
                resize();
              }}
              placeholder="Aklından ne geçiyor?"
              rows={1}
              className="w-full bg-transparent text-xl placeholder:text-muted resize-none py-2 min-h-[80px]"
            />

            {previewUrl && (
              <div className="relative mt-2 rounded-2xl overflow-hidden border border-border w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="" className="max-h-[300px] object-contain" />
                <button
                  onClick={handleRemoveImage}
                  aria-label="Görseli kaldır"
                  className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/75 flex items-center justify-center hover:bg-black/90 transition"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                    <path d="M18.3 5.71 12 12l6.3 6.29-1.42 1.42L10.59 13.4 4.3 19.7 2.88 18.3 9.17 12 2.88 5.71 4.3 4.29l6.29 6.3 6.29-6.3z" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-1 -ml-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFilePick(e.target.files?.[0])}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Görsel ekle"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-accent hover:bg-accent/10 transition"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M3 5.5C3 4.12 4.12 3 5.5 3h13C19.88 3 21 4.12 21 5.5v13c0 1.38-1.12 2.5-2.5 2.5h-13C4.12 21 3 19.88 3 18.5v-13ZM5.5 5c-.28 0-.5.22-.5.5v9.98l3.44-4.3a.5.5 0 0 1 .77-.02l2.6 2.99 4.32-5.75a.5.5 0 0 1 .8 0L19 12.5V5.5a.5.5 0 0 0-.5-.5h-13ZM19 18.5v-2.9l-3.6-4.9-4.36 5.8a.5.5 0 0 1-.78.03l-2.6-2.99L5 17.3v1.2c0 .28.22.5.5.5h13c.28 0 .5-.22.5-.5Z" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {content.length > 0 && (
                  <span
                    className={`text-xs ${remaining < 0 ? "text-red-500" : "text-muted"}`}
                  >
                    {remaining}
                  </span>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="rounded-full bg-accent text-white font-bold px-5 py-2 text-[15px] disabled:opacity-50 hover:bg-accent/90 transition"
                >
                  {posting ? "..." : isEdit ? "Kaydet" : "Paylaş"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
