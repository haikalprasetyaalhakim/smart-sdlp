import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { MasterArsipSMARTPage } from "@/features/arsip/components/master-arsip";

const PAGE_SIZE = 10;

const SORTABLE_COLUMNS = [
  "createdAt",
  "realisasi",
  "realIni",
  "fisik",
  "kode",
] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];

function isSortableColumn(value: string | undefined): value is SortableColumn {
  return !!value && (SORTABLE_COLUMNS as readonly string[]).includes(value);
}

export default async function ArsipPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    order?: string;
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
  const sort: SortableColumn = isSortableColumn(params.sort)
    ? params.sort
    : "createdAt";
  const order: Prisma.SortOrder = params.order === "asc" ? "asc" : "desc";
  const q = params.q?.trim() ?? "";
  const status =
    params.status && params.status !== "ALL" ? params.status : undefined;
  const periodeParam =
    params.periode && params.periode !== "ALL" ? params.periode : undefined;

  // Parsing filter periode jika ada (format "Bulan-Tahun" contoh "8-2026")
  let filterBulan: number | undefined;
  let filterTahun: number | undefined;
  if (periodeParam && periodeParam.includes("-")) {
    const [b, t] = periodeParam.split("-");
    filterBulan = Number(b);
    filterTahun = Number(t);
  }

  const where: Prisma.LaporanWhereInput = {
    ...(q && {
      OR: [
        { kegiatan: { nama: { contains: q, mode: "insensitive" } } },
        { kegiatan: { kode: { contains: q, mode: "insensitive" } } },
        { submittedBy: { name: { contains: q, mode: "insensitive" } } },
        { kegiatan: { pj: { name: { contains: q, mode: "insensitive" } } } },
      ],
    }),
    ...(status && { statusAnggaran: status as any }),
    ...(filterBulan &&
      filterTahun && {
        periodeBulan: filterBulan,
        periodeTahun: filterTahun,
      }),
  };

  // Penentuan Order By
  let orderBy: Prisma.LaporanOrderByWithRelationInput = { createdAt: order };
  if (sort === "realisasi") orderBy = { realisasi: order };
  else if (sort === "realIni") orderBy = { realIni: order };
  else if (sort === "fisik") orderBy = { fisik: order };
  else if (sort === "kode") orderBy = { kegiatan: { kode: order } };

  const [
    laporanList,
    totalFiltered,
    totalKegiatan,
    kegiatanSudahLapor,
    availablePeriods,
  ] = await Promise.all([
    prisma.laporan.findMany({
      where,
      include: {
        kegiatan: {
          include: { pj: true },
        },
        submittedBy: true,
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.laporan.count({ where }),
    prisma.kegiatan.count(),
    prisma.kegiatan.count({ where: { sudahLapor: true } }),
    prisma.laporan.groupBy({
      by: ["periodeBulan", "periodeTahun"],
      orderBy: [{ periodeTahun: "desc" }, { periodeBulan: "desc" }],
    }),
  ]);

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

  const serializedArsip = laporanList.map((l) => ({
    id: l.id,
    kegiatanId: l.kegiatanId,
    kode: l.kegiatan.kode,
    nama: l.kegiatan.nama,
    periode: `${NAMA_BULAN[l.periodeBulan - 1]} ${l.periodeTahun}`,
    periodeBulan: l.periodeBulan,
    periodeTahun: l.periodeTahun,
    tanggal: l.createdAt.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    pagu: Number(l.kegiatan.pagu),
    realisasi: Number(l.realisasi),
    realIni: Number(l.realIni),
    fisik: l.fisik,
    statusAnggaran: l.statusAnggaran,
    uploader: l.submittedBy?.name || l.kegiatan.pj?.name || "PJ Kegiatan",
    email: l.submittedBy?.email || l.kegiatan.pj?.email || "-",
    nip: l.submittedBy?.nip || l.kegiatan.pj?.nip || "-",
    uraian: l.uraian,
  }));

  const periodOptions = availablePeriods.map((p) => ({
    value: `${p.periodeBulan}-${p.periodeTahun}`,
    label: `${NAMA_BULAN[p.periodeBulan - 1]} ${p.periodeTahun}`,
  }));

  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));

  if (page > totalPages) {
    const next = new URLSearchParams();
    next.set("page", String(totalPages));
    if (params.q) next.set("q", params.q);
    if (params.periode) next.set("periode", params.periode);
    if (params.status) next.set("status", params.status);
    if (params.sort) next.set("sort", params.sort);
    if (params.order) next.set("order", params.order);
    redirect(`/admin/arsip-sp2d?${next.toString()}`);
  }

  return (
    <MasterArsipSMARTPage
      arsipList={serializedArsip}
      stats={{
        totalArsip: totalFiltered,
        totalKegiatan,
        kegiatanSudahLapor,
        kegiatanBelumLapor: totalKegiatan - kegiatanSudahLapor,
      }}
      pagination={{
        page,
        totalPages,
        total: totalFiltered,
        pageSize: PAGE_SIZE,
      }}
      periodOptions={periodOptions}
      currentParams={{
        q,
        periode: periodeParam ?? "ALL",
        status: status ?? "ALL",
        sort,
        order,
      }}
    />
  );
}
