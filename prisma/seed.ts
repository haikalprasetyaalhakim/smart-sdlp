import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { hashPassword } from "better-auth/crypto";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ⚠️ CEK src/lib/auth.ts: pastikan nilai ini sama dengan yang dipakai
// Better Auth saat generate Account record untuk credential provider.
const CREDENTIAL_ISSUER = "credential";

const ACCOUNTS = [
  {
    name: "Admin Pusdatin",
    email: "admin.pusdatin@pertanian.go.id",
    password: "Admin@SMART2026",
    role: "ADMIN" as const,
    nip: "19820514 200604 1 002",
    jabatan: "Pranata Komputer Ahli Muda",
    unitKerja: "Pusat Data dan Sistem Informasi Pertanian",
  },
  {
    name: "Ir. Budi Santoso, M.Si.",
    email: "budi.santoso@pertanian.go.id",
    password: "PJ@SMART2026",
    role: "USER" as const,
    nip: "19780412 200312 1 001",
    jabatan: "Penanggung Jawab (PJ) Kegiatan",
    unitKerja:
      "Balai Besar Perakitan dan Modernisasi Sumber Daya Lahan Pertanian",
  },
];

async function main() {
  console.log("🌱 Seeding database SMART BRMP SDLAHAN...\n");

  for (const acc of ACCOUNTS) {
    // Cek apakah akun sudah ada
    const existing = await prisma.user.findUnique({
      where: { email: acc.email },
    });

    if (existing) {
      console.log(`⚠️  Akun sudah ada, skip: ${acc.email}`);
      continue;
    }

    // Hash password menggunakan algoritma yang sama dengan Better Auth
    const hashedPassword = await hashPassword(acc.password);

    // Buat User beserta Account (credential provider)
    const user = await prisma.user.create({
      data: {
        name: acc.name,
        email: acc.email,
        emailVerified: true,
        role: acc.role,
        nip: acc.nip,
        jabatan: acc.jabatan,
        unitKerja: acc.unitKerja,
        accounts: {
          create: {
            accountId: acc.email,
            providerId: "credential",
            issuer: CREDENTIAL_ISSUER,
            password: hashedPassword,
          },
        },
      },
    });

    console.log(
      `✅ Berhasil membuat akun [${acc.role}]: ${user.name} <${user.email}>`,
    );
  }

  console.log("\n✅ Seeding selesai!");
  console.log("\n📋 Kredensial Demo:");
  console.log("   Admin : admin.pusdatin@pertanian.go.id / Admin@SMART2026");
  console.log("   PJ    : budi.santoso@pertanian.go.id / PJ@SMART2026");
  console.log("\n⚠️  Ganti password sebelum deploy ke production!\n");
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
