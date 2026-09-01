import { Activity } from "@/types";
import { DonutChartSegment } from "@/components/ui/donut-chart";

export const MAIN_PROGRAM_CATEGORIES = [
  {
    name: "Layanan Perkantoran",
    color: "#134B88",
    description: "Operasional, gaji, tunjangan, dan pemeliharaan sarana perkantoran",
    defaultPrefix: "6918",
  },
  {
    name: "Fasilitas Kinerja",
    color: "#236437",
    description: "Pendampingan kinerja, monitoring evaluasi, SAKIP & akuntabilitas",
    defaultPrefix: "6918",
  },
  {
    name: "Klinik Modernisasi/KMP",
    color: "#E28B59",
    description: "Klinik modernisasi pertanian, identifikasi lahan presisi, & tata kelola gambut",
    defaultPrefix: "7912",
  },
  {
    name: "Alat & Sarana",
    color: "#8E44AD",
    description: "Pengadaan alat laboratorium modern, sensor lapang, dan drone spasial",
    defaultPrefix: "7911",
  },
] as const;

export type ProgramCategoryType =
  | "Layanan Perkantoran"
  | "Fasilitas Kinerja"
  | "Klinik Modernisasi/KMP"
  | "Alat & Sarana"
  | "Program Lainnya/Unassigned";

export const PROGRAM_COLORS: Record<string, string> = {
  "Layanan Perkantoran": "#134B88",
  "Fasilitas Kinerja": "#236437",
  "Klinik Modernisasi/KMP": "#E28B59",
  "Alat & Sarana": "#8E44AD",
  "Program Lainnya/Unassigned": "#64748B",
};

/**
 * Auto-categorization engine:
 * 1. Checks explicit manual category if set
 * 2. Matches keywords in name/code
 * 3. Matches 4-digit code prefixes (6918, 7911, 7912)
 * 4. Fallback: "Program Lainnya/Unassigned"
 */
export function resolveProgramCategory(
  kode: string,
  nama?: string,
  manualCategory?: string
): string {
  if (manualCategory && manualCategory.trim()) {
    return manualCategory.trim();
  }

  const cleanKode = (kode || "").toUpperCase().trim();
  const cleanNama = (nama || "").toLowerCase();

  // Priority 1: Keyword-based high accuracy detection
  if (
    cleanNama.includes("gaji") ||
    cleanNama.includes("perkantoran") ||
    cleanNama.includes("gedung") ||
    cleanKode.includes("994")
  ) {
    return "Layanan Perkantoran";
  }

  if (
    cleanNama.includes("sakip") ||
    cleanNama.includes("akuntabilitas") ||
    cleanNama.includes("evaluasi") ||
    cleanNama.includes("pendampingan") ||
    cleanKode.includes("962") ||
    cleanKode.includes("963")
  ) {
    return "Fasilitas Kinerja";
  }

  if (
    cleanNama.includes("alat") ||
    cleanNama.includes("laboratorium") ||
    cleanNama.includes("sensor") ||
    cleanNama.includes("drone") ||
    cleanNama.includes("sarana")
  ) {
    return "Alat & Sarana";
  }

  if (
    cleanNama.includes("klinik") ||
    cleanNama.includes("lahan") ||
    cleanNama.includes("gambut") ||
    cleanNama.includes("citarum") ||
    cleanNama.includes("pemupukan") ||
    cleanNama.includes("tanah")
  ) {
    return "Klinik Modernisasi/KMP";
  }

  // Priority 2: 4-Digit Prefix Fallback
  if (cleanKode.startsWith("6918")) {
    return "Fasilitas Kinerja";
  }

  if (cleanKode.startsWith("7911")) {
    return "Alat & Sarana";
  }

  if (cleanKode.startsWith("7912")) {
    return "Klinik Modernisasi/KMP";
  }

  return "Program Lainnya/Unassigned";
}

/**
 * Real-time dynamic aggregation of Activities into Program Donut Chart Segments
 */
export function aggregateProgramPagu(activities: Activity[]): DonutChartSegment[] {
  const totals: Record<string, { totalPagu: number; count: number; color: string }> = {};

  MAIN_PROGRAM_CATEGORIES.forEach((cat) => {
    totals[cat.name] = {
      totalPagu: 0,
      count: 0,
      color: cat.color,
    };
  });

  activities.forEach((act) => {
    const category = resolveProgramCategory(act.kode, act.nama, act.programCategory);
    const color = PROGRAM_COLORS[category] || "#64748B";

    if (!totals[category]) {
      totals[category] = {
        totalPagu: 0,
        count: 0,
        color: color,
      };
    }

    totals[category].totalPagu += act.pagu || 0;
    totals[category].count += 1;
  });

  const grandTotal = Object.values(totals).reduce((sum, item) => sum + item.totalPagu, 0);

  const segments: DonutChartSegment[] = Object.entries(totals)
    .filter(([_, data]) => data.totalPagu > 0 || data.count > 0)
    .map(([name, data]) => {
      const pct = grandTotal > 0 ? (data.totalPagu / grandTotal) * 100 : 0;
      return {
        label: name,
        value: data.totalPagu,
        percentage: Number(pct.toFixed(1)),
        color: data.color,
      };
    });

  if (segments.length === 0) {
    return MAIN_PROGRAM_CATEGORIES.map((c) => ({
      label: c.name,
      value: 0,
      percentage: 0,
      color: c.color,
    }));
  }

  return segments;
}
