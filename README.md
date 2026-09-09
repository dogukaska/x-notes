# Notlar

X (Twitter) arayüzüne benzeyen, kişisel not defteri. Next.js + Supabase.

## Kurulum

1. `.env.local.example` dosyasını `.env.local` olarak kopyala ve Supabase proje bilgilerini gir:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
2. `supabase/schema.sql` dosyasını Supabase Dashboard > SQL Editor'de çalıştır.
3. Supabase Dashboard > Authentication > Users'dan kendine bir kullanıcı oluştur (email + şifre). Authentication > Sign In / Providers'da "Allow new users to sign up" kapalı tutulabilir, çünkü bu tek kullanıcılı bir uygulama.
4. `npm install`
5. `npm run dev`

## Dağıtım

Vercel'e bağlanıp yukarıdaki iki ortam değişkenini Vercel proje ayarlarına ekleyerek deploy edilir.
