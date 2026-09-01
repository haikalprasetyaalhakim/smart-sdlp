import * as XLSX from "xlsx";

export interface SmartReportItem {
  no: number;
  kode: string;
  nama: string;
  jenis: "APBN" | "NON-APBN";
  pj?: string;
  uraian: string;
  fisik: number;
  pagu: number;
  statusAnggaran: "Dibuka" | "Diblokir";
  realLalu: number;
  realIni: number;
  realSd?: number;
  pct?: number;
  sisa?: number;
}

export function generateSmartReportExcel(
  items: SmartReportItem[],
  periode = "Agustus 2026",
  fileName = "laporan_realisasi_smart.xlsx"
) {
  const wsData: any[][] = [
    ["KEMENTERIAN PERTANIAN REPUBLIK INDONESIA"],
    ["BADAN STANDARDISASI INSTRUMEN PERTANIAN"],
    ["BALAI BESAR PERAKITAN DAN MODERNISASI SUMBER DAYA LAHAN PERTANIAN"],
    ["LAPORAN REALISASI CAPAIAN DAN ANGGARAN KEGIATAN (SMART)"],
    [`Periode: ${periode} | Tahun Anggaran: 2026 | Format Resmi Kementerian Pertanian`],
    [],
    [
      "No",
      "Kode",
      "Kegiatan",
      "Jenis Kegiatan",
      "Penanggung Jawab (PJ)",
      "Realisasi Capaian Kegiatan",
      "",
      "Pagu Anggaran",
      "Status Anggaran",
      "Realisasi Anggaran",
      "",
      "",
      "",
      "Sisa Anggaran",
    ],
    [
      "",
      "",
      "",
      "",
      "",
      "Uraian Kegiatan Periode Ini",
      "Realisasi Fisik (%)",
      "",
      "",
      "Periode Lalu",
      "Periode Ini",
      "s.d. Periode",
      "%",
      "",
    ],
  ];

  let totalPagu = 0;
  let totalRealLalu = 0;
  let totalRealIni = 0;
  let totalRealSd = 0;
  let totalSisa = 0;

  items.forEach((item, index) => {
    const realSd =
      item.realSd !== undefined
        ? item.realSd
        : item.realLalu + item.realIni;
    const pct =
      item.pct !== undefined
        ? item.pct
        : item.pagu > 0
        ? (realSd / item.pagu) * 100
        : 0;
    const sisa = item.sisa !== undefined ? item.sisa : item.pagu - realSd;
    const pjName = item.pj || "Budi Santoso";

    totalPagu += item.pagu;
    totalRealLalu += item.realLalu;
    totalRealIni += item.realIni;
    totalRealSd += realSd;
    totalSisa += sisa;

    wsData.push([
      index + 1,
      item.kode,
      item.nama,
      item.jenis,
      pjName,
      item.uraian,
      Number(item.fisik) / 100,
      item.pagu,
      item.statusAnggaran,
      item.realLalu,
      item.realIni,
      realSd,
      pct / 100,
      sisa,
    ]);
  });

  const avgPct = totalPagu > 0 ? (totalRealSd / totalPagu) * 100 : 0;

  wsData.push([
    "",
    "",
    "TOTAL REKAPITULASI",
    "",
    `${items.length} PJ Terdaftar`,
    "",
    "",
    totalPagu,
    "",
    totalRealLalu,
    totalRealIni,
    totalRealSd,
    avgPct / 100,
    totalSisa,
  ]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!views"] = [{ showGridLines: true }];

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 13 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 13 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 13 } },
    { s: { r: 6, c: 0 }, e: { r: 7, c: 0 } },
    { s: { r: 6, c: 1 }, e: { r: 7, c: 1 } },
    { s: { r: 6, c: 2 }, e: { r: 7, c: 2 } },
    { s: { r: 6, c: 3 }, e: { r: 7, c: 3 } },
    { s: { r: 6, c: 4 }, e: { r: 7, c: 4 } },
    { s: { r: 6, c: 5 }, e: { r: 6, c: 6 } },
    { s: { r: 6, c: 7 }, e: { r: 7, c: 7 } },
    { s: { r: 6, c: 8 }, e: { r: 7, c: 8 } },
    { s: { r: 6, c: 9 }, e: { r: 6, c: 12 } },
    { s: { r: 6, c: 13 }, e: { r: 7, c: 13 } },
  ];

  ws["!cols"] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 36 },
    { wch: 14 },
    { wch: 22 },
    { wch: 42 },
    { wch: 14 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 10 },
    { wch: 20 },
  ];

  const startDataRow = 8;
  const endDataRow = startDataRow + items.length;

  for (let R = startDataRow; R <= endDataRow; ++R) {
    const fisikCell = ws[XLSX.utils.encode_cell({ r: R, c: 6 })];
    if (fisikCell && typeof fisikCell.v === "number") {
      fisikCell.z = "0.0%";
    }

    const paguCell = ws[XLSX.utils.encode_cell({ r: R, c: 7 })];
    if (paguCell && typeof paguCell.v === "number") {
      paguCell.z = '"Rp "#,##0';
    }

    const laluCell = ws[XLSX.utils.encode_cell({ r: R, c: 9 })];
    if (laluCell && typeof laluCell.v === "number") {
      laluCell.z = '"Rp "#,##0';
    }

    const iniCell = ws[XLSX.utils.encode_cell({ r: R, c: 10 })];
    if (iniCell && typeof iniCell.v === "number") {
      iniCell.z = '"Rp "#,##0';
    }

    const sdCell = ws[XLSX.utils.encode_cell({ r: R, c: 11 })];
    if (sdCell && typeof sdCell.v === "number") {
      sdCell.z = '"Rp "#,##0';
    }

    const pctCell = ws[XLSX.utils.encode_cell({ r: R, c: 12 })];
    if (pctCell && typeof pctCell.v === "number") {
      pctCell.z = "0.0%";
    }

    const sisaCell = ws[XLSX.utils.encode_cell({ r: R, c: 13 })];
    if (sisaCell && typeof sisaCell.v === "number") {
      sisaCell.z = '"Rp "#,##0';
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan SMART");

  XLSX.writeFile(wb, fileName);
}
