import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserDashboard } from "@/components/UserDashboard";
import type { Activity } from "@/types";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [rows, laporanRows, laporanBulanIni] = await Promise.all([
    prisma.kegiatan.findMany({
      where: { pjId: session.user.id },
      include: { pj: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.laporan.findMany({
      where: { kegiatan: { pjId: session.user.id } },
      orderBy: [{ periodeTahun: "desc" }, { periodeBulan: "desc" }],
    }),
    // Cek spesifik: kegiatan mana yang SUDAH ada laporan untuk BULAN BERJALAN.
    prisma.laporan.findMany({
      where: {
        kegiatan: { pjId: session.user.id },
        periodeBulan: currentMonth,
        periodeTahun: currentYear,
      },
      select: { kegiatanId: true },
    }),
  ]);

  const kegiatanSudahLaporBulanIni = new Set(
    laporanBulanIni.map((l) => l.kegiatanId),
  );

  const activities: Activity[] = rows.map((k) => ({
    id: k.id,
    kode: k.kode,
    nama: k.nama,
    jenis: k.jenis === "NON_APBN" ? "NON-APBN" : "APBN",
    programCategory: k.programCategory ?? undefined,
    pagu: Number(k.pagu),
    realisasi: Number(k.realisasi),
    fisik: k.fisik ?? 0,
    uraian: k.uraian ?? undefined,
    statusAnggaran: k.statusAnggaran === "DIBLOKIR" ? "Diblokir" : "Dibuka",
    realLalu: k.realLalu !== null ? Number(k.realLalu) : 0,
    realIni: k.realIni !== null ? Number(k.realIni) : 0,
    pj: k.pj?.name,
    email: k.pj?.email,
    wajib: k.wajib,
    // Ganti sumber "sudahLapor" — bukan lagi cache statis, tapi cek nyata
    // terhadap tabel Laporan untuk bulan berjalan.
    sudahLapor: kegiatanSudahLaporBulanIni.has(k.id),
    status: kegiatanSudahLaporBulanIni.has(k.id) ? "done" : "pending",
  }));

  const laporanHistory = laporanRows.map((l) => ({
    id: l.id,
    kegiatanId: l.kegiatanId,
    periodeBulan: l.periodeBulan,
    periodeTahun: l.periodeTahun,
    uraian: l.uraian,
    fisik: l.fisik,
    statusAnggaran:
      l.statusAnggaran === "DIBLOKIR"
        ? ("Diblokir" as const)
        : ("Dibuka" as const),
    realIni: Number(l.realIni),
    realisasi: Number(l.realisasi),
  }));

  return (
    <UserDashboard activities={activities} laporanHistory={laporanHistory} />
  );
}
