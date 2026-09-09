"use client";

import { useEffect, useState } from "react";

export default function UndoToast({
  seconds = 5,
  onUndo,
  onExpire,
}: {
  seconds?: number;
  onUndo: () => void;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#1a1a1a] border border-border rounded-full pl-4 pr-2 py-2 shadow-lg">
      <span className="text-sm">Not silindi</span>
      <button
        onClick={onUndo}
        className="flex items-center gap-2 rounded-full bg-foreground text-background text-sm font-bold pl-3 pr-2 py-1.5 hover:opacity-90 transition"
      >
        Geri al
        <span className="w-5 h-5 rounded-full border border-background/40 flex items-center justify-center text-[11px]">
          {remaining}
        </span>
      </button>
    </div>
  );
}
