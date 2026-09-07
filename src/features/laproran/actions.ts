"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const submitLaporanSchema = z.object({
  kegiatanId: z.string().min(1),
  periodeBulan: z.number().int().min(1).max(12),
  periodeTahun: z.number().int().min(2020).max(2100),
  uraian: z.string().min(1, "Uraian kegiatan wajib diisi"),
  fisik: z.coerce.number().min(0).max(100),
  realIni: z.coerce.number().int().min(0),
});

export type SubmitLaporanInput = z.infer<typeof submitLaporanSchema>;

type SubmitLaporanResult =
  | {
      success: true;
      laporan: {
        id: string;
        kegiatanId: string;
        periodeBulan: number;
        periodeTahun: number;
        realisasi: number;
      };
    }
  | { success: false; error: string };

export async function submitLaporan(
  input: SubmitLaporanInput,
): Promise<SubmitLaporanResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Sesi tidak valid, silakan login ulang." };
  }

  const parsed = submitLaporanSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }
  const data = parsed.data;

  const kegiatan = await prisma.kegiatan.findUnique({
    where: { id: data.kegiatanId },
  });
  if (!kegiatan) {
    return { success: false, error: "Kegiatan tidak ditemukan." };
  }

  // Otorisasi PALING DEPAN.
  const isOwner = kegiatan.pjId === session.user.id;
  const isAdmin = session.user.role?.toLowerCase() === "admin";
  if (!isOwner && !isAdmin) {
    return {
      success: false,
      error: "Anda bukan Penanggung Jawab kegiatan ini.",
    };
  }

  // ── Ambil SEMUA laporan lain milik kegiatan ini (kecuali periode yang
  // sedang diedit) — satu query, dipakai untuk 2 kebutuhan berbeda:
  //  1. realLaluServer (narasi kronologis: cuma yang SEBELUM periode ini)
  //  2. totalUsedByOtherPeriods (validasi pagu: SEMUA periode lain, apa pun urutannya)
  const allOtherLaporan = await prisma.laporan.findMany({
    where: {
      kegiatanId: data.kegiatanId,
      NOT: { periodeBulan: data.periodeBulan, periodeTahun: data.periodeTahun },
    },
    orderBy: [{ periodeTahun: "desc" }, { periodeBulan: "desc" }],
  });

  const isBefore = (bulan: number, tahun: number) =>
    tahun < data.periodeTahun ||
    (tahun === data.periodeTahun && bulan < data.periodeBulan);

  const priorLaporan = allOtherLaporan.filter((l) =>
    isBefore(l.periodeBulan, l.periodeTahun),
  );
  const realLaluServer = priorLaporan.reduce(
    (sum, l) => sum + Number(l.realIni),
    0,
  );
  const totalUsedByOtherPeriods = allOtherLaporan.reduce(
    (sum, l) => sum + Number(l.realIni),
    0,
  );

  // ── Validasi status Diblokir ─────────────────────────────────────────
  if (kegiatan.statusAnggaran === "DIBLOKIR") {
    if (data.realIni !== 0) {
      return {
        success: false,
        error:
          "Anggaran kegiatan ini sedang diblokir, realisasi periode ini harus 0.",
      };
    }
    const maxFisik = priorLaporan[0]?.fisik ?? 0; // sudah terurut desc, [0] = paling baru
    if (data.fisik > maxFisik) {
      return {
        success: false,
        error: `Anggaran sedang diblokir, realisasi fisik tidak boleh melebihi ${maxFisik}% (nilai periode sebelumnya).`,
      };
    }
  }

  // ── Validasi batas pagu — pakai TOTAL dari semua periode lain,
  // bukan cuma yang sebelumnya, supaya tidak bisa disisipkan lewat bulan lampau.
  const totalIfSubmitted =
    BigInt(totalUsedByOtherPeriods) + BigInt(data.realIni);
  if (totalIfSubmitted > kegiatan.pagu) {
    const sisaRaw = kegiatan.pagu - BigInt(totalUsedByOtherPeriods);
    const sisa = sisaRaw > BigInt(0) ? sisaRaw : BigInt(0);
    const sisaFormatted = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(sisa));
    return {
      success: false,
      error: `Total realisasi seluruh periode melebihi pagu. Sisa jatah yang tersedia (di luar periode ini): ${sisaFormatted}.`,
    };
  }

  const realisasi = realLaluServer + data.realIni;

  const laporan = await prisma.$transaction(async (tx) => {
    const upserted = await tx.laporan.upsert({
      where: {
        kegiatanId_periodeBulan_periodeTahun: {
          kegiatanId: data.kegiatanId,
          periodeBulan: data.periodeBulan,
          periodeTahun: data.periodeTahun,
        },
      },
      create: {
        kegiatanId: data.kegiatanId,
        periodeBulan: data.periodeBulan,
        periodeTahun: data.periodeTahun,
        uraian: data.uraian,
        fisik: data.fisik,
        statusAnggaran: kegiatan.statusAnggaran,
        realLalu: BigInt(realLaluServer),
        realIni: BigInt(data.realIni),
        realisasi: BigInt(realisasi),
        submittedById: session.user.id,
      },
      update: {
        uraian: data.uraian,
        fisik: data.fisik,
        statusAnggaran: kegiatan.statusAnggaran,
        realLalu: BigInt(realLaluServer),
        realIni: BigInt(data.realIni),
        realisasi: BigInt(realisasi),
        submittedById: session.user.id,
      },
    });

    // ── Hitung ulang cache Kegiatan dari SEMUA laporan yang ada, BUKAN cuma
    // dari sudut pandang periode yang baru disubmit. Ini krusial kalau PJ
    // submit tidak berurutan kronologis (misal isi Mei duluan, baru April
    // menyusul) — cache harus tetap mencerminkan TOTAL sesungguhnya dan
    // progres fisik dari periode yang PALING BARU secara kalender, bukan
    // dari submission yang paling terakhir dilakukan.
    const allLaporanForKegiatan = await tx.laporan.findMany({
      where: { kegiatanId: data.kegiatanId },
      orderBy: [{ periodeTahun: "desc" }, { periodeBulan: "desc" }],
    });

    const totalRealisasi = allLaporanForKegiatan.reduce(
      (sum, l) => sum + l.realIni,
      BigInt(0),
    );
    const latestChronological = allLaporanForKegiatan[0]; // sudah terurut desc

    await tx.kegiatan.update({
      where: { id: data.kegiatanId },
      data: {
        uraian: latestChronological.uraian,
        fisik: latestChronological.fisik,
        realLalu: totalRealisasi - latestChronological.realIni,
        realIni: latestChronological.realIni,
        realisasi: totalRealisasi,
        sudahLapor: true,
      },
    });

    return upserted;
  });

  revalidatePath("/dashboard");
  revalidatePath("/input");
  revalidatePath("/admin/master");

  return {
    success: true,
    laporan: {
      id: laporan.id,
      kegiatanId: laporan.kegiatanId,
      periodeBulan: laporan.periodeBulan,
      periodeTahun: laporan.periodeTahun,
      realisasi: Number(laporan.realisasi),
    },
  };
}
