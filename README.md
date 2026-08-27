# BRMP Application Scaffold

Scaffold Next.js App Router yang sudah dilengkapi dengan komponen UI (Shadcn UI), autentikasi (Better Auth), database ORM (Prisma 7 + Neon PostgreSQL), dan email client (Nodemailer).

---

## 🚀 Quick Start untuk Rekan Pengembang

### 1. Install Dependencies
```bash
bun install
```

### 2. Konfigurasi Environment Variables
Salin `.env.example` menjadi `.env` dan isi dengan kredensial asli:
```bash
cp .env.example .env
```

Pastikan mengisi:
- `DATABASE_URL`: Connection string PostgreSQL dari Neon.
- `BETTER_AUTH_SECRET`: Secret key Better Auth.
- `SMTP_USER` & `SMTP_PASSWORD`: Kredensial SMTP untuk Nodemailer.

### 3. Generate & Push Database Schema
```bash
bunx prisma generate
bunx prisma db push
```

### 4. Jalankan Development Server
```bash
bun dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 📂 Struktur & Setup Siap Pakai

- **Shadcn UI**: Seluruh komponen UI sudah tersedia di `src/components/ui/`.
- **Tema & Warna**: Edit variabel warna di `src/app/globals.css`.
- **Database (Prisma 7 + Neon)**: `src/lib/prisma.ts` & `prisma/schema.prisma`.
- **Autentikasi (Better Auth)**:
  - Server: `src/lib/auth.ts`
  - Client: `src/lib/auth-client.ts`
  - Route API: `src/app/api/auth/[...all]/route.ts`
- **Email (Nodemailer)**: `src/lib/mailer.ts` (`sendMail()`).
- **Instruksi untuk AI Assistant**: Lihat [AGENTS.md](AGENTS.md).
