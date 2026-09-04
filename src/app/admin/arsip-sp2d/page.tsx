import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  MasterArsipSMARTPage,
  type ArsipItem,
} from "@/features/arsip/components/master-arsip";

const PAGE_SIZE = 10;

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

export default async function ArsipPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    periode?: string;
    status?: string;
  }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");
  if (session.user.role?.toLowerCase() !== "admin") redirect("/dashboard");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const q = params.q?.trim().toLowerCase() ?? "";
  const statusParam =
    params.status && params.status !== "ALL" ? params.status : "ALL";
  const periodeParam =
    params.periode && params.periode !== "ALL" ? params.periode : "ALL";

  const [kegiatanList, laporanList, availablePeriods] = await Promise.all([
    prisma.kegiatan.findMany({
      include: { pj: true },
      orderBy: { kode: "asc" },
    }),
    prisma.laporan.findMany({
      include: {
        kegiatan: { include: { pj: true } },
        submittedBy: true,
      },
      orderBy: [
        { periodeTahun: "desc" },
        { periodeBulan: "desc" },
        { createdAt: "desc" },
      ],
    }),
    prisma.laporan.groupBy({
      by: ["periodeBulan", "periodeTahun"],
      orderBy: [{ periodeTahun: "desc" }, { periodeBulan: "desc" }],
    }),
  ]);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const activeMonth = currentMonth;
  const activeYear = currentYear;

  let targetMonth: number | null = null;
  let targetYear: number | null = null;

  if (periodeParam !== "ALL" && periodeParam.includes("-")) {
    const [b, t] = periodeParam.split("-");
    targetMonth = Number(b);
    targetYear = Number(t);
  }

  // ── Bangun Matriks Arsip ────────────────────────────────────────────────
  const allItems: ArsipItem[] = [];

  if (targetMonth && targetYear) {
    // Mode Spesifik Periode
    const activeLabel = `${NAMA_BULAN[targetMonth - 1]} ${targetYear}`;
    const laporanBulanIni = laporanList.filter(
      (l) => l.periodeBulan === targetMonth && l.periodeTahun === targetYear,
    );
    const uploadedKegiatanIds = new Set(
      laporanBulanIni.map((l) => l.kegiatanId),
    );

    for (const l of laporanBulanIni) {
      allItems.push({
        id: l.id,
        kegiatanId: l.kegiatanId,
        laporanId: l.id,
        kode: l.kegiatan.kode,
        nama: l.kegiatan.nama,
        periode: activeLabel,
        periodeBulan: l.periodeBulan,
        periodeTahun: l.periodeTahun,
        jenis: l.kegiatan.jenis as "APBN" | "NON-APBN",
        pjNama: l.submittedBy?.name || l.kegiatan.pj?.name || "PJ Kegiatan",
        pjEmail: l.submittedBy?.email || l.kegiatan.pj?.email || "-",
        waktuUpload:
          l.createdAt.toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }) + " WIB",
        status: "SUDAH_UPLOAD",
        pagu: Number(l.kegiatan.pagu),
        realisasi: Number(l.realisasi),
        realIni: Number(l.realIni),
        fisik: l.fisik,
        statusAnggaran: l.statusAnggaran,
        uraian: l.uraian,
      });
    }

    for (const k of kegiatanList) {
      if (!uploadedKegiatanIds.has(k.id)) {
        allItems.push({
          id: `unuploaded-${k.id}-${targetMonth}-${targetYear}`,
          kegiatanId: k.id,
          laporanId: null,
          kode: k.kode,
          nama: k.nama,
          periode: activeLabel,
          periodeBulan: targetMonth,
          periodeTahun: targetYear,
          jenis: k.jenis as "APBN" | "NON-APBN",
          pjNama: k.pj?.name || "PJ Belum Ditentukan",
          pjEmail: k.pj?.email || "-",
          waktuUpload: "—",
          status: "BELUM_UPLOAD",
          pagu: Number(k.pagu),
          realisasi: Number(k.realisasi),
          realIni: Number(k.realIni || 0),
          fisik: k.fisik || 0,
          statusAnggaran: k.statusAnggaran,
          uraian: null,
        });
      }
    }
  } else {
    // Mode Semua Periode
    for (const l of laporanList) {
      allItems.push({
        id: l.id,
        kegiatanId: l.kegiatanId,
        laporanId: l.id,
        kode: l.kegiatan.kode,
        nama: l.kegiatan.nama,
        periode: `${NAMA_BULAN[l.periodeBulan - 1]} ${l.periodeTahun}`,
        periodeBulan: l.periodeBulan,
        periodeTahun: l.periodeTahun,
        jenis: l.kegiatan.jenis as "APBN" | "NON-APBN",
        pjNama: l.submittedBy?.name || l.kegiatan.pj?.name || "PJ Kegiatan",
        pjEmail: l.submittedBy?.email || l.kegiatan.pj?.email || "-",
        waktuUpload:
          l.createdAt.toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }) + " WIB",
        status: "SUDAH_UPLOAD",
        pagu: Number(l.kegiatan.pagu),
        realisasi: Number(l.realisasi),
        realIni: Number(l.realIni),
        fisik: l.fisik,
        statusAnggaran: l.statusAnggaran,
        uraian: l.uraian,
      });
    }

    const uploadedInDefault = new Set(
      laporanList
        .filter(
          (l) =>
            l.periodeBulan === activeMonth && l.periodeTahun === activeYear,
        )
        .map((l) => l.kegiatanId),
    );

    const activePeriodLabel = `${NAMA_BULAN[activeMonth - 1]} ${activeYear}`;
    for (const k of kegiatanList) {
      if (!uploadedInDefault.has(k.id)) {
        allItems.push({
          id: `unuploaded-${k.id}-${activeMonth}-${activeYear}`,
          kegiatanId: k.id,
          laporanId: null,
          kode: k.kode,
          nama: k.nama,
          periode: activePeriodLabel,
          periodeBulan: activeMonth,
          periodeTahun: activeYear,
          jenis: k.jenis as "APBN" | "NON-APBN",
          pjNama: k.pj?.name || "PJ Belum Ditentukan",
          pjEmail: k.pj?.email || "-",
          waktuUpload: "—",
          status: "BELUM_UPLOAD",
          pagu: Number(k.pagu),
          realisasi: Number(k.realisasi),
          realIni: Number(k.realIni || 0),
          fisik: k.fisik || 0,
          statusAnggaran: k.statusAnggaran,
          uraian: null,
        });
      }
    }
  }

  // ── SEMUA KODE DI BAWAH INI SEKARANG DI LUAR if/else — dipakai KEDUA mode ──

  const sudahCount = allItems.filter((i) => i.status === "SUDAH_UPLOAD").length;
  const belumCount = allItems.filter((i) => i.status === "BELUM_UPLOAD").length;
  const totalCount = allItems.length;

  let filteredItems = allItems;

  if (q) {
    filteredItems = filteredItems.filter(
      (item) =>
        item.kode.toLowerCase().includes(q) ||
        item.nama.toLowerCase().includes(q) ||
        item.pjNama.toLowerCase().includes(q) ||
        item.pjEmail.toLowerCase().includes(q),
    );
  }

  if (statusParam === "SUDAH_UPLOAD") {
    filteredItems = filteredItems.filter(
      (item) => item.status === "SUDAH_UPLOAD",
    );
  } else if (statusParam === "BELUM_UPLOAD") {
    filteredItems = filteredItems.filter(
      (item) => item.status === "BELUM_UPLOAD",
    );
  }

  const totalFiltered = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));

  if (page > totalPages) {
    const next = new URLSearchParams();
    next.set("page", String(totalPages));
    if (params.q) next.set("q", params.q);
    if (params.periode) next.set("periode", params.periode);
    if (params.status) next.set("status", params.status);
    redirect(`/admin/arsip-sp2d?${next.toString()}`);
  }

  const paginatedItems = filteredItems.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const periodOptionsMap = new Map<string, string>();

  for (const p of availablePeriods) {
    const key = `${p.periodeBulan}-${p.periodeTahun}`;
    periodOptionsMap.set(
      key,
      `${NAMA_BULAN[p.periodeBulan - 1]} ${p.periodeTahun}`,
    );
  }

  for (let bulan = 1; bulan <= currentMonth; bulan++) {
    const key = `${bulan}-${currentYear}`;
    if (!periodOptionsMap.has(key)) {
      periodOptionsMap.set(key, `${NAMA_BULAN[bulan - 1]} ${currentYear}`);
    }
  }

  const periodOptions = Array.from(periodOptionsMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => {
      const [bMa, tMa] = a.value.split("-").map(Number);
      const [bMb, tMb] = b.value.split("-").map(Number);
      return tMb !== tMa ? tMb - tMa : bMb - bMa;
    });

  return (
    <MasterArsipSMARTPage
      arsipList={paginatedItems}
      stats={{ total: totalCount, sudah: sudahCount, belum: belumCount }}
      pagination={{
        page,
        totalPages,
        total: totalFiltered,
        pageSize: PAGE_SIZE,
      }}
      periodOptions={periodOptions}
      currentParams={{ q, periode: periodeParam, status: statusParam }}
    />
  );
}
