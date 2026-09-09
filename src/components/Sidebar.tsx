"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions";
import MoreMenu from "./MoreMenu";

export default function Sidebar({
  email,
  displayName,
  username,
  avatarUrl,
  onCompose,
}: {
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  onCompose?: () => void;
}) {
  const initial = displayName.charAt(0).toUpperCase();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const navItemClass = (active: boolean) =>
    `flex items-center gap-4 px-3 py-3 rounded-full hover:bg-hover transition cursor-pointer w-fit ${
      active ? "font-bold" : ""
    }`;

  return (
    <aside className="hidden md:flex flex-col justify-between w-[275px] shrink-0 h-screen sticky top-0 px-2 py-2">
      <div>
        <Link href="/" className="block p-3 w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Notlar" className="w-9 h-9 rounded-lg" />
        </Link>
        <nav className="flex flex-col gap-1 mt-2">
          <Link href="/" className={navItemClass(pathname === "/")}>
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-foreground">
              <path d="M12 1.696 0 12h3v9h6v-6h6v6h6v-9h3L12 1.696Z" />
            </svg>
            <span className="text-xl pr-4">Anasayfa</span>
          </Link>

          <Link href="/profile" className={navItemClass(pathname === "/profile")}>
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-foreground">
              <path d="M12 12.25c2.9 0 5.25-2.35 5.25-5.25S14.9 1.75 12 1.75 6.75 4.1 6.75 7s2.35 5.25 5.25 5.25ZM12 3.75c1.79 0 3.25 1.46 3.25 3.25S13.79 10.25 12 10.25 8.75 8.79 8.75 7 10.21 3.75 12 3.75ZM12 14.25c-4.42 0-8 2.69-8 6v1.25a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V20.25c0-3.31-3.58-6-8-6Zm-6 5.25v-.25c0-2.07 2.7-4 6-4s6 1.93 6 4v.25H6Z" />
            </svg>
            <span className="text-xl pr-4">Profil</span>
          </Link>

          <div className="relative">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={navItemClass(moreOpen)}
            >
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-foreground">
                <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2Zm7 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2Zm7 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2Z" />
              </svg>
              <span className="text-xl pr-4">Daha fazla</span>
            </button>
            {moreOpen && <MoreMenu onClose={() => setMoreOpen(false)} />}
          </div>
        </nav>
        {onCompose ? (
          <button
            onClick={onCompose}
            className="mt-4 w-[90%] rounded-full bg-accent text-white font-bold py-3.5 text-[17px] hover:bg-accent/90 transition"
          >
            Not yaz
          </button>
        ) : (
          <Link
            href="/"
            className="mt-4 flex items-center justify-center w-[90%] rounded-full bg-accent text-white font-bold py-3.5 text-[17px] hover:bg-accent/90 transition"
          >
            Not yaz
          </Link>
        )}
      </div>

      <form action={signOut} className="mb-2">
        <button
          type="submit"
          title={email}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-full hover:bg-hover transition text-left"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <span className="w-9 h-9 rounded-full bg-accent flex items-center justify-center font-bold text-white shrink-0">
              {initial}
            </span>
          )}
          <span className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold truncate">{displayName}</span>
            <span className="text-xs text-muted truncate">@{username}</span>
          </span>
        </button>
      </form>
    </aside>
  );
}
