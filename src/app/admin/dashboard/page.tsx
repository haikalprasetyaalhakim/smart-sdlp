import { prisma } from "@/lib/prisma";
import { AdminDashboard } from "@/components/admin-dashboard";
import type { Activity } from "@/types";

const NAMA_BULAN_SINGKAT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export default async function Page() {
  const [kegiatanRows, laporanRows] = await Promise.all([
    prisma.kegiatan.findMany({
      include: { pj: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.laporan.findMany({
      include: { kegiatan: { select: { jenis: true } } },
      orderBy: [{ periodeTahun: "asc" }, { periodeBulan: "asc" }],
    }),
  ]);

  const activities: Activity[] = kegiatanRows.map((k) => ({
    id: k.id,
    kode: k.kode,
    nama: k.nama,
    jenis: k.jenis === "NON_APBN" ? "NON-APBN" : "APBN",
    programCategory: k.programCategory ?? undefined,
    pagu: Number(k.pagu),
    realisasi: Number(k.realisasi),
    fisik: k.fisik ?? 0,
    uraian: k.uraian ?? undefined,
    statusAnggaran: k.statusAnggaran === "DIBLOKIR" ? "Diblokir" : "Dibuka",
    realLalu: k.realLalu !== null ? Number(k.realLalu) : 0,
    realIni: k.realIni !== null ? Number(k.realIni) : 0,
    pj: k.pj?.name,
    email: k.pj?.email,
    wajib: k.wajib,
    sudahLapor: k.sudahLapor,
    status: k.sudahLapor ? "done" : "pending",
  }));

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Bar chart: total realisasi PER BULAN (bukan kumulatif), Januari s.d. bulan berjalan.
  const barData = Array.from({ length: currentMonth }, (_, i) => {
    const bulan = i + 1;
    const laporanBulanIni = laporanRows.filter(
      (l) => l.periodeBulan === bulan && l.periodeTahun === currentYear,
    );
    const apbn_real = laporanBulanIni
      .filter((l) => l.kegiatan.jenis === "APBN")
      .reduce((sum, l) => sum + Number(l.realIni), 0);
    const non_real = laporanBulanIni
      .filter((l) => l.kegiatan.jenis === "NON_APBN")
      .reduce((sum, l) => sum + Number(l.realIni), 0);
    return { name: NAMA_BULAN_SINGKAT[i], apbn_real, non_real };
  });

  // Kurva-S: realisasi kumulatif (%) vs target LINEAR (asumsi — belum ada
  // data rencana pencairan bulanan resmi/RKAKL di schema kita saat ini).
  const totalPagu = activities.reduce((sum, a) => sum + a.pagu, 0);
  let runningTotal = 0;
  const lineDataFull = Array.from({ length: 12 }, (_, i) => {
    const bulanKe = i + 1;
    const target = Number(((bulanKe / 12) * 100).toFixed(1));

    if (bulanKe > currentMonth) {
      return { name: NAMA_BULAN_SINGKAT[i], target, realisasi: undefined };
    }

    const laporanBulanIni = laporanRows.filter(
      (l) => l.periodeBulan === bulanKe && l.periodeTahun === currentYear,
    );
    // eslint-disable-next-line react-hooks/immutability
    runningTotal += laporanBulanIni.reduce(
      (sum, l) => sum + Number(l.realIni),
      0,
    );
    const realisasi =
      totalPagu > 0 ? Number(((runningTotal / totalPagu) * 100).toFixed(1)) : 0;

    return { name: NAMA_BULAN_SINGKAT[i], target, realisasi };
  });

  return (
    <AdminDashboard
      activities={activities}
      barData={barData}
      lineDataFull={lineDataFull}
    />
  );
}
