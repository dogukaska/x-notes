"use client";

import { useEffect, useRef, useState } from "react";
import { Profile } from "@/lib/types";

export type ProfileEditResult = {
  display_name: string;
  username: string;
  bio: string;
  avatarFile: File | null;
  bannerFile: File | null;
};

export default function EditProfileModal({
  profile,
  avatarUrl,
  bannerUrl,
  onClose,
  onSubmit,
}: {
  profile: Profile;
  avatarUrl: string | null;
  bannerUrl: string | null;
  onClose: () => void;
  onSubmit: (result: ProfileEditResult) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(bannerUrl);
  const [saving, setSaving] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canSave = displayName.trim().length > 0 && username.trim().length > 0 && !saving;

  const handleSubmit = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSubmit({
        display_name: displayName.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""),
        bio: bio.trim(),
        avatarFile,
        bannerFile,
      });
      onClose();
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
          <h2 className="text-xl font-bold flex-1">Profili düzenle</h2>
          <button
            onClick={handleSubmit}
            disabled={!canSave}
            className="rounded-full bg-foreground text-background font-bold px-4 py-1.5 text-[15px] disabled:opacity-50 hover:opacity-90 transition"
          >
            {saving ? "..." : "Kaydet"}
          </button>
        </div>

        <div className="overflow-y-auto">
          {/* Kapak fotoğrafı */}
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

          {/* Avatar */}
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
                  aria-label="Profil fotoğrafını değiştir"
                  className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/75 transition"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                    <path d="M9.5 5.5h5l1.5 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h3l1.5-2ZM12 9.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 1.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Alanlar */}
          <div className="px-4 py-4 flex flex-col gap-4">
            <label className="block border border-border rounded-md px-3 pt-2 pb-1 focus-within:border-accent">
              <span className="text-xs text-muted">İsim</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
                className="w-full bg-transparent text-[15px] focus:outline-none"
              />
            </label>

            <label className="block border border-border rounded-md px-3 pt-2 pb-1 focus-within:border-accent">
              <span className="text-xs text-muted">Kullanıcı adı</span>
              <div className="flex items-center">
                <span className="text-muted mr-0.5">@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.slice(0, 30))}
                  className="w-full bg-transparent text-[15px] focus:outline-none"
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
          </div>
        </div>
      </div>
    </div>
  );
}
