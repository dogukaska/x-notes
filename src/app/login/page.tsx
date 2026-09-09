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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Notlar" className="w-12 h-12 rounded-xl" />
        </div>
        <h1 className="text-2xl font-bold mb-6 text-center">Notlar&apos;a giriş yap</h1>

        {error && (
          <p className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <form action={signIn} className="flex flex-col gap-3">
          <input
            name="identifier"
            type="text"
            required
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="Kullanıcı adı veya e-posta"
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
