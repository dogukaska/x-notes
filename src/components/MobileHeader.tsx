"use client";

import { signOut } from "@/app/actions";

export default function MobileHeader({ email }: { email: string }) {
  const initial = email.charAt(0).toUpperCase();

  return (
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
  );
}
