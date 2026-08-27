# Project Brief & AI Agent Guidelines

Dokumen ini adalah instruksi panduan utama untuk AI Assistant (Antigravity / Cursor / Copilot / Windsurf) saat bekerja di repository ini.

---

## 🚨 Langkah Pertama Sebelum Memulai Coding (Wajib Dibaca AI)

Saat developer pertama kali membuka project ini atau meminta bantuan implementasi fitur bisnis:

1. **Cek Variabel Lingkungan (`.env`)**:
   - Pastikan file `.env` sudah ada dan berisi konfigurasi asli (bukan placeholder default).
   - Variabel yang harus diisi:
     - `DATABASE_URL`: Connection string PostgreSQL dari Neon.
     - `BETTER_AUTH_SECRET`: Secret key Better Auth.
     - `BETTER_AUTH_URL` & `NEXT_PUBLIC_BETTER_AUTH_URL`: URL aplikasi (e.g. `http://localhost:3000`).
     - `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`: Konfigurasi SMTP untuk Nodemailer.
   - Jika nilai `.env` masih berupa placeholder, ingatkan developer untuk mengisi `.env` terlebih dahulu.

2. **Sinkronisasi Database**:
   - Jalankan `bunx prisma generate` untuk memastikan client ter-generate.
   - Jalankan `bunx prisma db push` untuk mensinkronisasi schema ke database Neon developer.

---

## 🛠️ Stack & Setup yang Sudah Selesai Dikonfigurasi

Infrastruktur dasar sudah disiapkan secara modular:

### 1. UI & Styling (Shadcn UI + Tailwind CSS v4)
- **Komponen**: Semua komponen Shadcn UI sudah terinstal lengkap di [`src/components/ui/`](file:///src/components/ui).
- **Tema & Warna**: Variabel tema dan color palette berada di [`src/app/globals.css`](file:///src/app/globals.css). Jika ingin menyesuaikan warna dengan desain (misal dari Google Stitch / Figma), sesuaikan variabel warna di file tersebut.

### 2. Database & ORM (Prisma 7 + Neon Postgres)
- **Konfigurasi**: [`prisma.config.ts`](file:///prisma.config.ts) (Prisma 7 TypeScript config).
- **Schema**: [`prisma/schema.prisma`](file:///prisma/schema.prisma) (berisi model `User`, `Session`, `Account`, `Verification`).
- **Prisma Client Singleton**: [`src/lib/prisma.ts`](file:///src/lib/prisma.ts) (menggunakan `@prisma/adapter-neon`).
- Jika menambahkan model bisnis baru di `prisma/schema.prisma`, selalu jalankan `bunx prisma db push` dan `bunx prisma generate`.

### 3. Authentication (Better Auth)
- **Server Instance**: [`src/lib/auth.ts`](file:///src/lib/auth.ts) (mendukung Email & Password, terintegrasi otomatis dengan Nodemailer untuk Reset Password & Verifikasi Email).
- **Client Instance**: [`src/lib/auth-client.ts`](file:///src/lib/auth-client.ts) (`signIn`, `signUp`, `signOut`, `useSession`).
- **API Route Handler**: [`src/app/api/auth/[...all]/route.ts`](file:///src/app/api/auth/[...all]/route.ts).

### 4. Email Transporter (Nodemailer)
- **Mailer Helper**: [`src/lib/mailer.ts`](file:///src/lib/mailer.ts).
- Fungsi utama:
  ```typescript
  import { sendMail } from "@/lib/mailer";

  await sendMail({
    to: "user@example.com",
    subject: "Subjek Email",
    html: "<p>Konten HTML</p>",
    text: "Konten teks",
  });
  ```

---

## 📌 Pedoman Implementasi Fitur Bisnis

- **Langsung Fokus ke Logika Bisnis**: Developer tidak perlu mengulang setup auth, mailer, database connection, atau instalasi komponen UI.
- **Server Components / Server Actions**: Gunakan `auth.api.getSession({ headers: await headers() })` dari `@/lib/auth` untuk otorisasi server-side.
- **Client Components**: Gunakan `useSession()`, `signIn`, `signUp`, `signOut` dari `@/lib/auth-client`.
- **Database Query**: Import `prisma` dari `@/lib/prisma`.
