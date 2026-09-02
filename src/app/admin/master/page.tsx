import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { ManajemenKegiatanPage } from "@/features/admin/manage-activities/components/manajemen-kegiatan-page";

const PAGE_SIZE = 5;

const SORTABLE_COLUMNS = [
  "kode",
  "nama",
  "pagu",
  "realisasi",
  "createdAt",
] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];

function isSortableColumn(value: string | undefined): value is SortableColumn {
  return !!value && (SORTABLE_COLUMNS as readonly string[]).includes(value);
}

export default async function Page({
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
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const sort: SortableColumn = isSortableColumn(params.sort)
    ? params.sort
    : "createdAt";
  const order: Prisma.SortOrder = params.order === "asc" ? "asc" : "desc";
  const q = params.q?.trim() ?? "";
  const kategori =
    params.kategori && params.kategori !== "ALL" ? params.kategori : undefined;

  const where: Prisma.KegiatanWhereInput = {
    ...(q && {
      OR: [
        { nama: { contains: q, mode: "insensitive" } },
        { kode: { contains: q, mode: "insensitive" } },
        { pj: { name: { contains: q, mode: "insensitive" } } },
      ],
    }),
    ...(kategori && { programCategory: kategori }),
  };

  const [rows, total, pjOptions] = await Promise.all([
    prisma.kegiatan.findMany({
      where,
      include: { pj: { select: { id: true, name: true, email: true } } },
      orderBy: { [sort]: order },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.kegiatan.count({ where }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Konversi BigInt -> Number sebelum lintas boundary server -> client (wajib)
  const data = rows.map((k) => ({
    ...k,
    pagu: Number(k.pagu),
    realisasi: Number(k.realisasi),
    realLalu: k.realLalu !== null ? Number(k.realLalu) : null,
    realIni: k.realIni !== null ? Number(k.realIni) : null,
  }));

  return (
    <ManajemenKegiatanPage
      data={data}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
      sort={sort}
      order={order}
      pjOptions={pjOptions}
    />
  );
}
