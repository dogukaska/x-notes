import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="flex justify-center mb-8">
          <svg viewBox="0 0 24 24" className="w-10 h-10 fill-foreground">
            <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3 6.9 3.8L12 12 5.1 8.1 12 4.3ZM5 9.9l6 3.3v6.9l-6-3.3V9.9Zm8 10.2v-6.9l6-3.3v6.7l-6 3.5Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-6 text-center">Notlar&apos;a giriş yap</h1>

        {error && (
          <p className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <form action={signIn} className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            required
            placeholder="E-posta"
            className="w-full rounded-md border border-border bg-transparent px-3 py-3 text-[15px] placeholder:text-muted focus:outline-none focus:border-accent"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Şifre"
            className="w-full rounded-md border border-border bg-transparent px-3 py-3 text-[15px] placeholder:text-muted focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-foreground text-background font-bold py-3 text-[15px] hover:opacity-90 transition"
          >
            Giriş yap
          </button>
        </form>
      </div>
    </div>
  );
}
