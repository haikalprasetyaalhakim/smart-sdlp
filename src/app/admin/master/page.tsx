import { ManajemenKegiatanPage } from "@/features/admin/manage-activities/components/manajemen-kegiatan-page";
import { prisma } from "@/lib/prisma";

export default async function Page() {
  const [kegiatanList, pjOptions] = await Promise.all([
    prisma.kegiatan.findMany({
      include: { pj: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serialized = kegiatanList.map((k) => ({
    ...k,
    pagu: Number(k.pagu),
    realisasi: Number(k.realisasi),
    realLalu: k.realLalu !== null ? Number(k.realLalu) : null,
    realIni: k.realIni !== null ? Number(k.realIni) : null,
  }));

  return (
    <ManajemenKegiatanPage initialKegiatan={serialized} pjOptions={pjOptions} />
  );
}
