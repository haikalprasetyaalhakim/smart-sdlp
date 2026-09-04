import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { RepositoriPage } from "@/components/RepositoriPage";

const PAGE_SIZE = 10;

const SORTABLE_COLUMNS = ["createdAt", "nama", "tanggal", "kategori"] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];

function isSortableColumn(value: string | undefined): value is SortableColumn {
  return !!value && (SORTABLE_COLUMNS as readonly string[]).includes(value);
}

export default async function RepositoriRoute({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    order?: string;
    q?: string;
    kategori?: string;
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
  const kategoriParam =
    params.kategori && params.kategori !== "ALL" ? params.kategori : undefined;

  const where: Prisma.DokumenWhereInput = {
    ...(q && {
      OR: [
        { nama: { contains: q, mode: "insensitive" } },
        { kegiatan: { kode: { contains: q, mode: "insensitive" } } },
        { kegiatan: { nama: { contains: q, mode: "insensitive" } } },
        { uploader: { name: { contains: q, mode: "insensitive" } } },
      ],
    }),
    ...(kategoriParam && { kategori: kategoriParam as any }),
  };

  const [docs, total, statsSK, statsDIPA, statsLaporan, kegiatanList] =
    await Promise.all([
      prisma.dokumen.findMany({
        where,
        include: {
          kegiatan: { select: { id: true, kode: true, nama: true } },
          uploader: { select: { id: true, name: true, email: true } },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.dokumen.count({ where }),
      prisma.dokumen.count({ where: { kategori: "SK" } }),
      prisma.dokumen.count({ where: { kategori: "DIPA" } }),
      prisma.dokumen.count({ where: { kategori: "LAPORAN" } }),
      prisma.kegiatan.findMany({
        select: { id: true, kode: true, nama: true },
        orderBy: { kode: "asc" },
      }),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (page > totalPages) {
    const next = new URLSearchParams();
    next.set("page", String(totalPages));
    if (params.q) next.set("q", params.q);
    if (params.kategori) next.set("kategori", params.kategori);
    if (params.sort) next.set("sort", params.sort);
    if (params.order) next.set("order", params.order);
    redirect(`/admin/repositori?${next.toString()}`);
  }

  const serializedDocs = docs.map((d) => ({
    id: d.id,
    nama: d.nama,
    kategori: d.kategori,
    kegiatan: d.kegiatan ? `${d.kegiatan.kode} ${d.kegiatan.nama}` : "—",
    kegiatanId: d.kegiatanId,
    tanggal: d.tanggal.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    ukuran: d.ukuran || "1.2 MB",
    uploader: d.uploader?.name || "Admin Pusdatin",
    fileUrl: d.fileUrl,
  }));

  return (
    <RepositoriPage
      docs={serializedDocs}
      stats={{
        total,
        sk: statsSK,
        dipa: statsDIPA,
        laporan: statsLaporan,
      }}
      pagination={{
        page,
        totalPages,
        total,
        pageSize: PAGE_SIZE,
      }}
      kegiatanOptions={kegiatanList}
      currentParams={{
        q,
        kategori: kategoriParam ?? "ALL",
        sort,
        order,
      }}
    />
  );
}
