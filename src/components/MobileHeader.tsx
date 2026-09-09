"use client";

import { useState } from "react";
import Link from "next/link";
import MoreMenu from "./MoreMenu";

export default function MobileHeader({ avatarUrl }: { avatarUrl: string | null }) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <header className="md:hidden sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur">
      <Link href="/profile">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl ?? "/logo.png"}
          alt=""
          className="w-8 h-8 rounded-full object-cover bg-hover"
        />
      </Link>

      <Link href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Notlar" className="w-8 h-8 rounded-lg" />
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
