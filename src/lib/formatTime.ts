export function formatFullDate(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time}`;
}
