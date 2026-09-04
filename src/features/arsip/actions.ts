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

export async function ingatkanPJ(kegiatanId: string, periode: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role?.toLowerCase() !== "admin") {
    return {
      success: false,
      error: "Hanya Admin yang berhak mengirim email pengingat.",
    };
  }

  try {
    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: kegiatanId },
      include: { pj: true },
    });

    if (!kegiatan) {
      return { success: false, error: "Kegiatan tidak ditemukan." };
    }

    const pjEmail = kegiatan.pj?.email;
    const pjName = kegiatan.pj?.name || "Penanggung Jawab Kegiatan";

    if (!pjEmail) {
      return {
        success: false,
        error: "PJ Kegiatan ini belum memiliki alamat email yang terdaftar.",
      };
    }

    const { sendMail } = await import("@/lib/mailer");

    const mailResult = await sendMail({
      to: pjEmail,
      subject: `[PENGINGAT] Unggah Laporan SMART - ${kegiatan.kode} (${periode})`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h3 style="color: #065f46; margin-top: 0;">Pemberitahuan Pelaporan SMART SDLAHAN</h3>
          <p>Yth. <strong>${pjName}</strong>,</p>
          <p>Melalui email ini, kami menginformasikan bahwa berkas <strong>Laporan SMART</strong> untuk kegiatan Anda belum terunggah:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; width: 140px;">Kode Kegiatan</td>
              <td style="padding: 8px 0; font-weight: bold; color: #065f46;">${kegiatan.kode}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b;">Nama Kegiatan</td>
              <td style="padding: 8px 0; font-weight: 600;">${kegiatan.nama}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b;">Periode</td>
              <td style="padding: 8px 0; font-weight: 600;">${periode}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Status</td>
              <td style="padding: 8px 0; font-weight: bold; color: #e11d48;">BELUM DIUNGGAH</td>
            </tr>
          </table>
          <p>Mohon kesediaan Bapak/Ibu untuk segera masuk ke aplikasi <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"}/dashboard" style="color: #065f46; font-weight: bold;">SMART BRMP SDLAHAN</a> untuk melakukan pelaporan realisasi.</p>
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
            Email ini dikirim secara otomatis oleh Administrator SMART BRMP SDLAHAN.
          </div>
        </div>
      `,
      text: `Yth. ${pjName}, mohon segera mengunggah Laporan SMART untuk kegiatan ${kegiatan.kode} (${kegiatan.nama}) periode ${periode}.`,
    });

    if (!mailResult.success) {
      return {
        success: false,
        error: "Gagal mengirim email — periksa konfigurasi SMTP server.",
      };
    }

    return {
      success: true,
      message: `Email pengingat berhasil dikirim ke ${pjEmail}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Gagal mengirim email pengingat.",
    };
  }
}
