"use client";

import { useEffect, useRef, useState } from "react";
import { Category } from "@/lib/types";

export type CategoryEditResult = {
  display_name: string;
  username: string;
  bio: string;
  avatarFile: File | null;
  bannerFile: File | null;
};

const RESERVED = ["profile", "login", "u", "api", "kullanici"];

export default function CategoryModal({
  category,
  avatarUrl,
  bannerUrl,
  onClose,
  onSubmit,
  onDelete,
}: {
  category: Category | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  onClose: () => void;
  onSubmit: (result: CategoryEditResult) => Promise<void>;
  onDelete?: () => void;
}) {
  const isEdit = !!category;
  const [displayName, setDisplayName] = useState(category?.display_name ?? "");
  const [username, setUsername] = useState(category?.username ?? "");
  const [bio, setBio] = useState(category?.bio ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(bannerUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const canSave =
    displayName.trim().length > 0 &&
    cleanUsername.length > 0 &&
    !RESERVED.includes(cleanUsername) &&
    !saving;

  const handleSubmit = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        display_name: displayName.trim(),
        username: cleanUsername,
        bio: bio.trim(),
        avatarFile,
        bannerFile,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-2 pt-0 sm:pt-8"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[600px] bg-background border border-border rounded-none sm:rounded-2xl min-h-screen sm:min-h-0 flex flex-col">
        <div className="flex items-center gap-6 px-3 py-2 border-b border-border sm:border-none">
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-hover transition"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-foreground">
              <path d="M18.3 5.71 12 12l6.3 6.29-1.42 1.42L10.59 13.4 4.3 19.7 2.88 18.3 9.17 12 2.88 5.71 4.3 4.29l6.29 6.3 6.29-6.3z" />
            </svg>
          </button>
          <h2 className="text-xl font-bold flex-1">
            {isEdit ? "Kategoriyi düzenle" : "Yeni kategori"}
          </h2>
          <button
            onClick={handleSubmit}
            disabled={!canSave}
            className="rounded-full bg-foreground text-background font-bold px-4 py-1.5 text-[15px] disabled:opacity-50 hover:opacity-90 transition"
          >
            {saving ? "..." : isEdit ? "Kaydet" : "Oluştur"}
          </button>
        </div>

        <div className="overflow-y-auto">
          <div className="relative h-[150px] bg-hover">
            {bannerPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
            )}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setBannerFile(f);
                  setBannerPreview(URL.createObjectURL(f));
                }
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <button
                onClick={() => bannerInputRef.current?.click()}
                aria-label="Kapak fotoğrafını değiştir"
                className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/75 transition"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M9.5 5.5h5l1.5 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h3l1.5-2ZM12 9.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 1.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="px-4">
            <div className="relative w-24 h-24 -mt-12 rounded-full border-4 border-background bg-hover overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarPreview ?? "/logo.png"}
                alt=""
                className="w-full h-full object-cover"
              />
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setAvatarFile(f);
                    setAvatarPreview(URL.createObjectURL(f));
                  }
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  aria-label="Fotoğrafı değiştir"
                  className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/75 transition"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                    <path d="M9.5 5.5h5l1.5 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h3l1.5-2ZM12 9.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 1.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 flex flex-col gap-4">
            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <label className="block border border-border rounded-md px-3 pt-2 pb-1 focus-within:border-accent">
              <span className="text-xs text-muted">İsim</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
                placeholder="ör. Prompt Arşivi"
                className="w-full bg-transparent text-[15px] focus:outline-none placeholder:text-muted"
              />
            </label>

            <label className="block border border-border rounded-md px-3 pt-2 pb-1 focus-within:border-accent">
              <span className="text-xs text-muted">Kullanıcı adı</span>
              <div className="flex items-center">
                <span className="text-muted mr-0.5">@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.slice(0, 30))}
                  placeholder="prompt"
                  className="w-full bg-transparent text-[15px] focus:outline-none placeholder:text-muted"
                />
              </div>
            </label>

            <label className="block border border-border rounded-md px-3 pt-2 pb-1 focus-within:border-accent">
              <span className="text-xs text-muted">Biyografi</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                rows={3}
                className="w-full bg-transparent text-[15px] resize-none focus:outline-none"
              />
            </label>

            {isEdit && onDelete && (
              <button
                onClick={onDelete}
                className="mt-2 text-left text-red-500 hover:text-red-400 text-[15px] font-bold"
              >
                Kategoriyi sil
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
