"use client";

import { useState } from "react";
import Link from "next/link";
import MoreMenu from "./MoreMenu";

export default function MobileHeader({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl: string | null;
}) {
  const initial = displayName.charAt(0).toUpperCase();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <header className="md:hidden sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur">
      <Link href="/profile">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <span className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-bold text-white text-sm">
            {initial}
          </span>
        )}
      </Link>

      <Link href="/">
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-foreground">
          <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3 6.9 3.8L12 12 5.1 8.1 12 4.3ZM5 9.9l6 3.3v6.9l-6-3.3V9.9Zm8 10.2v-6.9l6-3.3v6.7l-6 3.5Z" />
        </svg>
      </Link>

      <div className="relative">
        <button
          onClick={() => setMoreOpen((v) => !v)}
          aria-label="Daha fazla"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-hover transition"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-foreground">
            <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2Zm7 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2Zm7 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2Z" />
          </svg>
        </button>
        {moreOpen && <MoreMenu align="down" onClose={() => setMoreOpen(false)} />}
      </div>
    </header>
  );
}
