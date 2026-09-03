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

  // Otorisasi PALING DEPAN — sebelum query lain atau validasi bisnis apa pun.
  // Ini KRUSIAL: tanpa ini, PJ mana pun bisa submit laporan atas nama kegiatan
  // orang lain sekadar dengan mengubah kegiatanId di request.
  const isOwner = kegiatan.pjId === session.user.id;
  const isAdmin = session.user.role?.toLowerCase() === "admin";
  if (!isOwner && !isAdmin) {
    return {
      success: false,
      error: "Anda bukan Penanggung Jawab kegiatan ini.",
    };
  }

  const priorLaporan = await prisma.laporan.findFirst({
    where: {
      kegiatanId: data.kegiatanId,
      OR: [
        { periodeTahun: { lt: data.periodeTahun } },
        {
          periodeTahun: data.periodeTahun,
          periodeBulan: { lt: data.periodeBulan },
        },
      ],
    },
    orderBy: [{ periodeTahun: "desc" }, { periodeBulan: "desc" }],
  });

  if (kegiatan.statusAnggaran === "DIBLOKIR") {
    if (data.realIni !== 0) {
      return {
        success: false,
        error:
          "Anggaran kegiatan ini sedang diblokir, realisasi periode ini harus 0.",
      };
    }
    const maxFisik = priorLaporan?.fisik ?? kegiatan.fisik ?? 0;
    if (data.fisik > maxFisik) {
      return {
        success: false,
        error: `Anggaran sedang diblokir, realisasi fisik tidak boleh melebihi ${maxFisik}% (nilai periode sebelumnya).`,
      };
    }
  }

  const priorAgg = await prisma.laporan.aggregate({
    where: {
      kegiatanId: data.kegiatanId,
      OR: [
        { periodeTahun: { lt: data.periodeTahun } },
        {
          periodeTahun: data.periodeTahun,
          periodeBulan: { lt: data.periodeBulan },
        },
      ],
    },
    _sum: { realIni: true },
  });
  const realLaluServer = Number(priorAgg._sum.realIni ?? 0);

  const totalIfSubmitted = BigInt(realLaluServer) + BigInt(data.realIni);

  if (totalIfSubmitted > kegiatan.pagu) {
    const sisaRaw = kegiatan.pagu - BigInt(realLaluServer);
    const sisa = sisaRaw > BigInt(0) ? sisaRaw : BigInt(0);
    const sisaFormatted = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(sisa));

    return {
      success: false,
      error: `Realisasi periode ini melebihi sisa anggaran. Sisa anggaran tersedia: ${sisaFormatted}.`,
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
        statusAnggaran: kegiatan.statusAnggaran, // snapshot dari Kegiatan, bukan input PJ
        realLalu: BigInt(realLaluServer),
        realIni: BigInt(data.realIni),
        realisasi: BigInt(realisasi),
        submittedById: session.user.id,
      },
      update: {
        uraian: data.uraian,
        fisik: data.fisik,
        statusAnggaran: kegiatan.statusAnggaran, // snapshot ulang juga saat koreksi laporan
        realLalu: BigInt(realLaluServer),
        realIni: BigInt(data.realIni),
        realisasi: BigInt(realisasi),
        submittedById: session.user.id,
      },
    });

    // Sinkron cache Kegiatan — TIDAK menyentuh statusAnggaran lagi,
    // itu murni domain admin sekarang.
    await tx.kegiatan.update({
      where: { id: data.kegiatanId },
      data: {
        uraian: data.uraian,
        fisik: data.fisik,
        realLalu: BigInt(realLaluServer),
        realIni: BigInt(data.realIni),
        realisasi: BigInt(realisasi),
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
