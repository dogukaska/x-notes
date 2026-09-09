"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/actions";
import { applyTheme, getStoredTheme, Theme } from "@/lib/theme";

export default function MoreMenu({
  onClose,
  align = "up",
}: {
  onClose: () => void;
  align?: "up" | "down";
}) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className={`absolute z-50 w-[280px] bg-background border border-border rounded-2xl shadow-2xl py-2 overflow-hidden ${
          align === "up" ? "bottom-full left-0 mb-2" : "top-full right-0 mt-2"
        }`}
      >
        <Link
          href="/profile"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3.5 hover:bg-hover transition text-[15px] font-bold"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-foreground">
            <path d="M12 12.25c2.9 0 5.25-2.35 5.25-5.25S14.9 1.75 12 1.75 6.75 4.1 6.75 7s2.35 5.25 5.25 5.25ZM12 3.75c1.79 0 3.25 1.46 3.25 3.25S13.79 10.25 12 10.25 8.75 8.79 8.75 7 10.21 3.75 12 3.75ZM12 14.25c-4.42 0-8 2.69-8 6v1.25a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V20.25c0-3.31-3.58-6-8-6Zm-6 5.25v-.25c0-2.07 2.7-4 6-4s6 1.93 6 4v.25H6Z" />
          </svg>
          Profili görüntüle
        </Link>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-hover transition text-[15px] font-bold text-left"
        >
          {theme === "dark" ? (
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-foreground">
              <path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm0 15a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1ZM4 11a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2h1Zm17 0a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2h1ZM5.64 5.64a1 1 0 0 1 1.41 0l.71.7a1 1 0 1 1-1.41 1.42l-.71-.71a1 1 0 0 1 0-1.41Zm11.6 11.6a1 1 0 0 1 1.41 0l.71.71a1 1 0 0 1-1.41 1.41l-.71-.7a1 1 0 0 1 0-1.42Zm0-11.6a1 1 0 0 1 1.41-1.41l.71.7a1 1 0 0 1-1.41 1.42l-.71-.71ZM5.64 18.36a1 1 0 0 1 0-1.42l.71-.7a1 1 0 1 1 1.41 1.41l-.71.7a1 1 0 0 1-1.41 0ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-foreground">
              <path d="M12.1 22c-5.5 0-10-4.5-10-10 0-4.8 3.4-8.9 8-9.8.4-.1.8.1 1 .4.2.3.2.8-.1 1.1-1.5 1.7-2.3 3.9-2.3 6.2 0 5.2 4.2 9.4 9.4 9.4.9 0 1.8-.1 2.6-.4.4-.1.8 0 1 .3.2.3.2.7-.1 1-1.9 1.8-4.4 2.8-7 2.8Z" />
            </svg>
          )}
          {theme === "dark" ? "Açık moda geç" : "Koyu moda geç"}
        </button>

        <form action={signOut}>
          <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-hover transition text-[15px] font-bold text-left">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-foreground">
              <path d="M12 3.75c.41 0 .75.34.75.75v6.5a.75.75 0 0 1-1.5 0v-6.5c0-.41.34-.75.75-.75Zm4.75 3.4a.75.75 0 0 1 .95-.13A8.25 8.25 0 1 1 6.3 7.02a.75.75 0 1 1 .9 1.2 6.75 6.75 0 1 0 8.6 0 .75.75 0 0 1-.05-1.07Z" />
            </svg>
            Çıkış yap
          </button>
        </form>
      </div>
    </>
  );
}
