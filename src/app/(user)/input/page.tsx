import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InputLaporanPage } from "@/components/InputLaporanPage";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ kode?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const params = await searchParams;

  const [kegiatanRows, laporanHistory] = await Promise.all([
    prisma.kegiatan.findMany({
      where: { pjId: session.user.id },
      orderBy: { nama: "asc" },
    }),
    prisma.laporan.findMany({
      where: { kegiatan: { pjId: session.user.id } },
      select: {
        kegiatanId: true,
        periodeBulan: true,
        periodeTahun: true,
        realIni: true,
        fisik: true,
      },
    }),
  ]);

  if (kegiatanRows.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs p-8 text-center">
        <p className="text-sm font-semibold text-slate-700">
          Belum ada kegiatan yang ditugaskan kepada Anda.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Hubungi admin untuk penugasan sebagai Penanggung Jawab kegiatan.
        </p>
      </div>
    );
  }

  const kegiatan = kegiatanRows.map((k) => ({
    id: k.id,
    kode: k.kode,
    nama: k.nama,
    jenis: k.jenis === "NON_APBN" ? ("NON-APBN" as const) : ("APBN" as const),
    pagu: Number(k.pagu),
    statusAnggaran:
      k.statusAnggaran === "DIBLOKIR"
        ? ("Diblokir" as const)
        : ("Dibuka" as const),
    uraian: k.uraian ?? "",
    fisik: k.fisik ?? 0,
    realLalu: k.realLalu !== null ? Number(k.realLalu) : 0,
    realIni: k.realIni !== null ? Number(k.realIni) : 0,
    realisasi: Number(k.realisasi),
  }));

  const initialSelectedKode =
    params.kode && kegiatan.some((k) => k.kode === params.kode)
      ? params.kode
      : kegiatan[0].kode;

  const laporanHistorySerialized = laporanHistory.map((l) => ({
    kegiatanId: l.kegiatanId,
    periodeBulan: l.periodeBulan,
    periodeTahun: l.periodeTahun,
    realIni: Number(l.realIni),
    fisik: l.fisik,
  }));

  return (
    <InputLaporanPage
      kegiatanList={kegiatan}
      initialSelectedKode={initialSelectedKode}
      sessionUser={{
        id: session.user.id,
        nama: session.user.name,
        email: session.user.email,
        nip: session.user.nip ?? "-",
        jabatan: session.user.jabatan ?? "Penanggung Jawab (PJ) Kegiatan",
      }}
      laporanHistory={laporanHistorySerialized}
    />
  );
}
