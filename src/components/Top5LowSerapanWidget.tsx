import React, { useState } from "react";
import { AlertCircle, ArrowUpRight, TrendingUp } from "lucide-react";

interface LowSerapanItem {
  nama: string;
  pct: number;
  color: string;
  textColor: string;
  pj?: string;
  pagu?: string;
}

const defaultLowData: LowSerapanItem[] = [
  {
    nama: "Alat Lab Modern",
    pct: 12.4,
    color: "bg-[#B91C1C]",
    textColor: "text-[#B91C1C]",
    pj: "Agus Widodo",
    pagu: "Rp 1.2 M",
  },
  {
    nama: "Sosialisasi Pert. Organik",
    pct: 18.7,
    color: "bg-[#C2410C]",
    textColor: "text-[#C2410C]",
    pj: "Siti Rahayu",
    pagu: "Rp 450 Jt",
  },
  {
    nama: "Kaw. Hortikultura",
    pct: 24.5,
    color: "bg-[#EA580C]",
    textColor: "text-[#EA580C]",
    pj: "Dewi Lestari",
    pagu: "Rp 850 Jt",
  },
  {
    nama: "Benih Padi Unggul",
    pct: 31.2,
    color: "bg-[#F97316]",
    textColor: "text-[#F97316]",
    pj: "Budi Santoso",
    pagu: "Rp 2.1 M",
  },
  {
    nama: "Rehabilitasi Irigasi",
    pct: 38.6,
    color: "bg-[#FB923C]",
    textColor: "text-[#FB923C]",
    pj: "Rudi Hartono",
    pagu: "Rp 1.6 M",
  },
];

const highTrendData: LowSerapanItem[] = [
  {
    nama: "Layanan Perkantoran",
    pct: 82.5,
    color: "bg-[#047857]",
    textColor: "text-[#047857]",
    pj: "Sekretariat",
    pagu: "Rp 4.2 M",
  },
  {
    nama: "Fasilitas Kinerja",
    pct: 78.4,
    color: "bg-[#059669]",
    textColor: "text-[#059669]",
    pj: "Bagian Umum",
    pagu: "Rp 3.8 M",
  },
  {
    nama: "Klinik Modernisasi/KMP",
    pct: 72.1,
    color: "bg-[#10B981]",
    textColor: "text-[#10B981]",
    pj: "Tim Teknis",
    pagu: "Rp 2.5 M",
  },
  {
    nama: "Pemetaan Lahan Gambut",
    pct: 69.3,
    color: "bg-[#34D399]",
    textColor: "text-[#34D399]",
    pj: "Tim Pemetaan",
    pagu: "Rp 1.1 M",
  },
  {
    nama: "Kaji Terap Varietas Unggul",
    pct: 65.8,
    color: "bg-[#6EE7B7]",
    textColor: "text-[#6EE7B7]",
    pj: "Kelompok Peneliti",
    pagu: "Rp 950 Jt",
  },
];

interface Top5LowSerapanWidgetProps {
  onNavigate?: (menu: string) => void;
}

export function Top5LowSerapanWidget({ onNavigate }: Top5LowSerapanWidgetProps) {
  const [activeSegment, setActiveSegment] = useState<"masalah" | "tren">("masalah");

  const displayData = activeSegment === "masalah" ? defaultLowData : highTrendData;

  return (
    <div className="bg-white rounded-lg p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block mb-1">
              KINERJA &amp; TREN
            </span>
            <h3 className="text-sm font-bold text-slate-800 leading-tight">
              {activeSegment === "masalah"
                ? "Top 5 Kegiatan Serapan Terendah (%)"
                : "Top 5 Kegiatan Serapan Tertinggi (%)"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeSegment === "masalah"
                ? "Kegiatan dengan persentase serapan paling rendah — perlu perhatian khusus."
                : "Kegiatan dengan pencapaian realisasi serapan tertinggi hingga periode ini."}
            </p>
          </div>

          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium self-start flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveSegment("tren")}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                activeSegment === "tren"
                  ? "bg-white text-emerald-800 font-semibold shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tren Serapan
            </button>
            <button
              type="button"
              onClick={() => setActiveSegment("masalah")}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                activeSegment === "masalah"
                  ? "bg-white text-emerald-800 font-semibold shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Masalah
            </button>
          </div>
        </div>

        <div className="pt-2 pb-1">
          <div className="relative">
            <div className="absolute inset-y-0 right-0 left-36 sm:left-44 pointer-events-none z-0">
              <div className="relative w-full h-full">
                {[0, 25, 50, 75, 100].map((pt) => (
                  <div
                    key={pt}
                    className={`absolute top-0 bottom-0 border-r border-dashed ${
                      pt === 50 ? "border-amber-300/80" : "border-slate-200/80"
                    }`}
                    style={{ left: `${pt}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              {displayData.map((item) => (
                <div key={item.nama} className="flex items-center group">
                  <div
                    className="text-xs font-medium text-slate-700 w-36 sm:w-44 text-right pr-3 truncate flex-shrink-0"
                    title={`${item.nama} (${item.pj || ""})`}
                  >
                    {item.nama}
                  </div>

                  <div className="flex-1 relative h-7 sm:h-8 flex items-center">
                    <div
                      className={`h-full ${item.color} rounded-r-md transition-all duration-500 ease-out flex items-center shadow-2xs group-hover:brightness-95`}
                      style={{ width: `${Math.max(3, Math.min(item.pct, 100))}%` }}
                    />
                    <span className="text-xs font-bold text-slate-900 pl-2 whitespace-nowrap">
                      {item.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center pt-3 mt-2 border-t border-slate-100 relative">
              <div className="w-36 sm:w-44 pr-3 flex-shrink-0" />

              <div className="flex-1 relative h-4">
                {[
                  { pt: 0, label: "0%", align: "left-0" },
                  { pt: 25, label: "25%", align: "-translate-x-1/2" },
                  { pt: 50, label: "50%", align: "-translate-x-1/2" },
                  { pt: 75, label: "75%", align: "-translate-x-1/2" },
                  { pt: 100, label: "100%", align: "-translate-x-full" },
                ].map((tick) => (
                  <span
                    key={tick.pt}
                    className={`absolute top-0 text-[10px] text-slate-400 font-medium ${tick.align} ${
                      tick.pt === 50 ? "text-amber-600 font-semibold" : ""
                    }`}
                    style={{ left: `${tick.pt}%` }}
                  >
                    {tick.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3.5 mt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          {activeSegment === "masalah" ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
              <span>Rata-rata 5 kegiatan kritis: <strong className="text-rose-700 font-bold">25.1%</strong></span>
            </>
          ) : (
            <>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Rata-rata 5 kegiatan terdepan: <strong className="text-emerald-700 font-bold">73.6%</strong></span>
            </>
          )}
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate("master")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition cursor-pointer"
          >
            Kelola Notifikasi PJ Terkait
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
