"use client";

export default function RightPanel({
  query,
  onQueryChange,
  total,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  total: number;
}) {
  return (
    <aside className="hidden lg:block w-[350px] shrink-0 px-4 py-2">
      <div className="sticky top-2 flex flex-col gap-4">
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 fill-muted absolute left-4 top-1/2 -translate-y-1/2"
          >
            <path d="M21.53 20.47l-5.4-5.4a8.5 8.5 0 1 0-1.06 1.06l5.4 5.4a.75.75 0 0 0 1.06-1.06ZM3.5 10.5a7 7 0 1 1 14 0 7 7 0 0 1-14 0Z" />
          </svg>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Notlarda ara"
            className="w-full bg-hover rounded-full pl-11 pr-4 py-3 text-[15px] placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:bg-background border border-transparent focus:border-accent"
          />
        </div>

        <div className="bg-hover/60 rounded-2xl p-4">
          <h2 className="text-xl font-bold mb-2">Not defterin</h2>
          <p className="text-sm text-muted">
            Toplam <span className="text-foreground font-semibold">{total}</span> not.
            Bu alan sadece sana özel — kimseyle paylaşılmıyor.
          </p>
        </div>
      </div>
    </aside>
  );
}
