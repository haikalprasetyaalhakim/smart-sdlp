"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function deleteLaporan(laporanId: string, alasan: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role?.toLowerCase() !== "admin") {
    return {
      success: false,
      error: "Hanya Admin yang berhak menghapus laporan arsip.",
    };
  }

  if (!alasan.trim()) {
    return { success: false, error: "Alasan penghapusan wajib diisi." };
  }

  try {
    const target = await prisma.laporan.findUnique({
      where: { id: laporanId },
      include: {
        kegiatan: {
          include: { pj: true },
        },
        submittedBy: true,
      },
    });

    if (!target) {
      return { success: false, error: "Laporan tidak ditemukan." };
    }

    const NAMA_BULAN = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const namaPeriode = `${NAMA_BULAN[target.periodeBulan - 1]} ${target.periodeTahun}`;

    await prisma.$transaction(async (tx) => {
      // 1. Simpan rekam jejak penghapusan ke tabel AuditLog
      await tx.auditLog.create({
        data: {
          action: "DELETE_LAPORAN",
          namaFile: `Laporan SMART ${namaPeriode} - ${target.kegiatan.kode}.xlsx`,
          kodeKegiatan: target.kegiatan.kode,
          namaKegiatan: target.kegiatan.nama,
          pemilikNama:
            target.submittedBy?.name ||
            target.kegiatan.pj?.name ||
            "PJ Kegiatan",
          pemilikEmail:
            target.submittedBy?.email || target.kegiatan.pj?.email || "-",
          adminNama: session.user.name,
          adminEmail: session.user.email,
          alasan: alasan.trim(),
          notifStatus: "Terkirim ke Email",
        },
      });

      // 2. Hapus laporan dari database
      await tx.laporan.delete({
        where: { id: laporanId },
      });

      // 3. Ambil laporan terakhir yang masih ada untuk sinkronisasi nilai Kegiatan
      const latestLaporan = await tx.laporan.findFirst({
        where: { kegiatanId: target.kegiatanId },
        orderBy: [{ periodeTahun: "desc" }, { periodeBulan: "desc" }],
      });

      if (latestLaporan) {
        await tx.kegiatan.update({
          where: { id: target.kegiatanId },
          data: {
            uraian: latestLaporan.uraian,
            fisik: Math.round(latestLaporan.fisik),
            realLalu: latestLaporan.realLalu,
            realIni: latestLaporan.realIni,
            realisasi: latestLaporan.realisasi,
            sudahLapor: true,
          },
        });
      } else {
        await tx.kegiatan.update({
          where: { id: target.kegiatanId },
          data: {
            uraian: null,
            fisik: 0,
            realLalu: BigInt(0),
            realIni: BigInt(0),
            realisasi: BigInt(0),
            sudahLapor: false,
          },
        });
      }
    });

    revalidatePath("/admin/arsip-sp2d");
    revalidatePath("/admin/log-audit");
    revalidatePath("/admin/master");
    revalidatePath("/admin/dashboard");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Gagal menghapus laporan.",
    };
  }
}
