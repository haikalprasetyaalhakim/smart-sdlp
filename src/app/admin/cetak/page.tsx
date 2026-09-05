import { prisma } from "@/lib/prisma";
import { CetakLaporanPage } from "@/components/CetakLaporanPage";

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

type PeriodeSelection =
  | { type: "bulan"; bulan: number; tahun: number }
  | { type: "semester"; semester: 1 | 2; tahun: number };

function parsePeriode(
  value: string,
  fallback: PeriodeSelection,
): PeriodeSelection {
  if (value.startsWith("S1-") || value.startsWith("S2-")) {
    const semester = value.startsWith("S1-") ? 1 : 2;
    const tahun = Number(value.split("-")[1]);
    if (!isNaN(tahun)) return { type: "semester", semester, tahun };
  } else if (value.includes("-")) {
    const [b, t] = value.split("-").map(Number);
    if (!isNaN(b) && !isNaN(t)) return { type: "bulan", bulan: b, tahun: t };
  }
  return fallback;
}

function periodeLabel(sel: PeriodeSelection): string {
  if (sel.type === "bulan") return `${NAMA_BULAN[sel.bulan - 1]} ${sel.tahun}`;
  return `Semester ${sel.semester === 1 ? "I" : "II"} ${sel.tahun}`;
}

function periodeValue(sel: PeriodeSelection): string {
  if (sel.type === "bulan") return `${sel.bulan}-${sel.tahun}`;
  return `S${sel.semester}-${sel.tahun}`;
}

export default async function CetakPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const params = await searchParams;

  const [kegiatanList, laporanList] = await Promise.all([
    prisma.kegiatan.findMany({
      include: { pj: { select: { name: true } } },
      orderBy: { kode: "asc" },
    }),
    prisma.laporan.findMany({
      orderBy: [{ periodeTahun: "asc" }, { periodeBulan: "asc" }],
    }),
  ]);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const defaultSelection: PeriodeSelection = {
    type: "bulan",
    bulan: currentMonth,
    tahun: currentYear,
  };
  const selection = params.periode
    ? parsePeriode(params.periode, defaultSelection)
    : defaultSelection;

  const selectedYear = selection.tahun;

  // ── Bangun opsi dropdown ────────────────────────────────────────────────
  const monthYearsWithData = new Set(laporanList.map((l) => l.periodeTahun));
  monthYearsWithData.add(currentYear);

  const monthOptions: { value: string; label: string }[] = [];
  for (const tahun of Array.from(monthYearsWithData).sort((a, b) => b - a)) {
    const maxBulan = tahun === currentYear ? currentMonth : 12;
    for (let bulan = maxBulan; bulan >= 1; bulan--) {
      monthOptions.push({
        value: `${bulan}-${tahun}`,
        label: `${NAMA_BULAN[bulan - 1]} ${tahun}`,
      });
    }
  }

  const semesterOptions: { value: string; label: string }[] = [];
  for (const tahun of Array.from(monthYearsWithData).sort((a, b) => b - a)) {
    // Semester I bisa dipilih begitu tahun itu sudah mulai (termasuk data parsial)
    semesterOptions.push({
      value: `S1-${tahun}`,
      label: `Semester I ${tahun}`,
    });
    // Semester II baru muncul begitu sudah masuk Juli tahun itu (atau tahun sudah lewat)
    if (tahun < currentYear || (tahun === currentYear && currentMonth >= 7)) {
      semesterOptions.push({
        value: `S2-${tahun}`,
        label: `Semester II ${tahun}`,
      });
    }
  }

  // ── Hitung baris laporan sesuai periode terpilih ───────────────────────
  const reportRows = kegiatanList.map((k, idx) => {
    const pagu = Number(k.pagu);

    let rangeStartBulan: number,
      rangeStartTahun: number,
      rangeEndBulan: number,
      rangeEndTahun: number;

    if (selection.type === "bulan") {
      rangeStartBulan = rangeEndBulan = selection.bulan;
      rangeStartTahun = rangeEndTahun = selection.tahun;
    } else {
      rangeStartBulan = selection.semester === 1 ? 1 : 7;
      rangeEndBulan = selection.semester === 1 ? 6 : 12;
      rangeStartTahun = rangeEndTahun = selection.tahun;
    }

    const isBeforeRange = (bulan: number, tahun: number) =>
      tahun < rangeStartTahun ||
      (tahun === rangeStartTahun && bulan < rangeStartBulan);
    const isInRange = (bulan: number, tahun: number) =>
      tahun === rangeStartTahun &&
      bulan >= rangeStartBulan &&
      bulan <= rangeEndBulan;

    const laporanKegiatan = laporanList.filter((l) => l.kegiatanId === k.id);

    const realLalu = laporanKegiatan
      .filter((l) => isBeforeRange(l.periodeBulan, l.periodeTahun))
      .reduce((sum, l) => sum + Number(l.realIni), 0);

    const laporanDalamRange = laporanKegiatan
      .filter((l) => isInRange(l.periodeBulan, l.periodeTahun))
      .sort((a, b) => a.periodeBulan - b.periodeBulan);

    const realIni = laporanDalamRange.reduce(
      (sum, l) => sum + Number(l.realIni),
      0,
    );

    const fisik =
      laporanDalamRange.length > 0
        ? laporanDalamRange[laporanDalamRange.length - 1].fisik
        : (k.fisik ?? 0);

    const uraian =
      laporanDalamRange.length > 0
        ? laporanDalamRange
            .map((l) => `${NAMA_BULAN[l.periodeBulan - 1]}: ${l.uraian}`)
            .join("; ")
        : "Belum ada laporan untuk periode ini.";

    const sdPeriode = realLalu + realIni;
    const pctSerapan = pagu > 0 ? (sdPeriode / pagu) * 100 : 0;
    const sisa = pagu - sdPeriode;

    return {
      no: idx + 1,
      kode: k.kode,
      nama: k.nama,
      jenis: k.jenis === "NON_APBN" ? ("NON-APBN" as const) : ("APBN" as const),
      pj: k.pj?.name || "Belum Ditugaskan",
      uraian,
      fisik,
      pagu,
      statusAnggaran:
        k.statusAnggaran === "DIBLOKIR"
          ? ("Diblokir" as const)
          : ("Dibuka" as const),
      realLalu,
      realIni,
      sdPeriode,
      pctSerapan,
      sisa,
    };
  });

  return (
    <CetakLaporanPage
      reportRows={reportRows}
      currentPeriode={periodeValue(selection)}
      currentPeriodeLabel={periodeLabel(selection)}
      monthOptions={monthOptions}
      semesterOptions={semesterOptions}
      currentTahun={selectedYear}
    />
  );
}
