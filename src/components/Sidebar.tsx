"use client";

import { signOut } from "@/app/actions";

export default function Sidebar({ email }: { email: string }) {
  const initial = email.charAt(0).toUpperCase();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col justify-between w-[275px] shrink-0 h-screen sticky top-0 px-2 py-2">
        <div>
          <div className="p-3">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-foreground">
              <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3 6.9 3.8L12 12 5.1 8.1 12 4.3ZM5 9.9l6 3.3v6.9l-6-3.3V9.9Zm8 10.2v-6.9l6-3.3v6.7l-6 3.5Z" />
            </svg>
          </div>
          <nav className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-4 px-3 py-3 rounded-full hover:bg-hover transition cursor-pointer w-fit">
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-foreground">
                <path d="M12 1.696 0 12h3v9h6v-6h6v6h6v-9h3L12 1.696Z" />
              </svg>
              <span className="text-xl font-bold pr-4">Anasayfa</span>
            </div>
          </nav>
        </div>

        <form action={signOut} className="mb-2">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-full hover:bg-hover transition text-left"
          >
            <span className="w-9 h-9 rounded-full bg-accent flex items-center justify-center font-bold text-white shrink-0">
              {initial}
            </span>
            <span className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold truncate">{email}</span>
              <span className="text-xs text-muted">Çıkış yap</span>
            </span>
          </button>
        </form>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur">
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-foreground">
          <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3 6.9 3.8L12 12 5.1 8.1 12 4.3ZM5 9.9l6 3.3v6.9l-6-3.3V9.9Zm8 10.2v-6.9l6-3.3v6.7l-6 3.5Z" />
        </svg>
        <form action={signOut}>
          <button
            type="submit"
            className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-bold text-white text-sm"
          >
            {initial}
          </button>
        </form>
      </header>
    </>
  );
}
