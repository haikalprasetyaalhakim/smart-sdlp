import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity } from "@/types";
import { fmtRupiah, Icons } from "@/utils/formatters";
import { resolveProgramCategory } from "@/utils/programCategorization";
import { Badge, ProgressBar } from "./KpiCard";

interface ProgramDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  programName: string | null;
  programColor?: string;
  programPagu?: number;
  activities: Activity[];
  onNavigate?: (menu: string) => void;
}

export function ProgramDetailModal({
  isOpen,
  onClose,
  programName,
  programColor = "#134B88",
  programPagu,
  activities,
  onNavigate,
}: ProgramDetailModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterJenis, setFilterJenis] = useState<"ALL" | "APBN" | "NON-APBN">("ALL");

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setFilterJenis("ALL");
    }
  }, [isOpen, programName]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const programActivities = useMemo(() => {
    if (!programName) return [];
    return activities.filter(
      (act) => resolveProgramCategory(act.kode, act.nama, act.programCategory) === programName
    );
  }, [activities, programName]);

  const totalPagu = useMemo(() => {
    const sum = programActivities.reduce((acc, curr) => acc + curr.pagu, 0);
    return sum > 0 ? sum : programPagu || 0;
  }, [programActivities, programPagu]);

  const totalRealisasi = useMemo(() => {
    return programActivities.reduce((acc, curr) => acc + curr.realisasi, 0);
  }, [programActivities]);

  const serapanPct = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;
  const sisaAnggaran = totalPagu - totalRealisasi;

  const avgFisik =
    programActivities.length > 0
      ? programActivities.reduce((acc, curr) => acc + (curr.fisik || 0), 0) /
        programActivities.length
      : 0;

  const displayedActivities = useMemo(() => {
    return programActivities.filter((act) => {
      const matchSearch =
        act.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (act.pj && act.pj.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchJenis = filterJenis === "ALL" || act.jenis === filterJenis;
      return matchSearch && matchJenis;
    });
  }, [programActivities, searchTerm, filterJenis]);

  if (!isOpen || !programName) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative bg-white rounded-xl shadow-2xl border border-slate-200/90 w-full max-w-5xl overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        >
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span
                className="w-3.5 h-3.5 rounded-full mt-1.5 flex-shrink-0 shadow-xs"
                style={{ backgroundColor: programColor }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    PROGRAM DRILL-DOWN VIEW
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                    TA 2026
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                  Rincian Kegiatan — {programName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar seluruh paket kegiatan, alokasi pagu DIPA, dan status penyerapan anggaran
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1.5 rounded-lg transition cursor-pointer"
              title="Tutup Modal (Esc)"
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d={Icons.close} />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white border-b border-slate-200/80">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                Total Pagu Program
              </span>
              <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                {fmtRupiah(totalPagu)}
              </p>
              <span className="text-[10.5px] text-slate-500 font-medium">
                {programActivities.length} Paket Kegiatan
              </span>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200/80">
              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide block">
                Realisasi Anggaran
              </span>
              <p className="text-sm sm:text-base font-bold text-emerald-800 mt-0.5">
                {fmtRupiah(totalRealisasi)}
              </p>
              <span className="text-[10.5px] text-emerald-700 font-medium">
                Serapan: {serapanPct.toFixed(1)}%
              </span>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/80">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wide block">
                Sisa Anggaran
              </span>
              <p className="text-sm sm:text-base font-bold text-amber-800 mt-0.5">
                {fmtRupiah(sisaAnggaran)}
              </p>
              <span className="text-[10.5px] text-amber-700 font-medium">
                Tersedia s.d. Akhir Tahun
              </span>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200/80">
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide block">
                Rata-rata Fisik
              </span>
              <p className="text-sm sm:text-base font-bold text-blue-800 mt-0.5">
                {avgFisik.toFixed(1)}%
              </p>
              <span className="text-[10.5px] text-blue-700 font-medium">
                Capaian Output Riil
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Cari kode, nama kegiatan, atau PJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#134B88] focus:border-transparent"
              />
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <path d={Icons.search} />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs font-semibold text-slate-500">Filter Sumber:</span>
              <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs">
                {(["ALL", "APBN", "NON-APBN"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterJenis(t)}
                    className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                      filterJenis === t
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {t === "ALL" ? "Semua" : t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-[220px] max-h-[420px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3">Kode Kegiatan</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Nama Kegiatan</th>
                  <th className="py-2.5 px-3">Jenis</th>
                  <th className="py-2.5 px-3">Penanggung Jawab (PJ)</th>
                  <th className="py-2.5 px-3 text-right">Pagu Anggaran</th>
                  <th className="py-2.5 px-3 text-right">Realisasi (Rp)</th>
                  <th className="py-2.5 px-3 min-w-[120px]">Serapan (%)</th>
                  <th className="py-2.5 px-3 text-center">Fisik</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {displayedActivities.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg
                          width={32}
                          height={32}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="text-slate-300"
                        >
                          <path d={Icons.search} />
                        </svg>
                        <p className="font-semibold text-slate-600">
                          Tidak ada kegiatan ditemukan
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {searchTerm
                            ? `Tidak ada hasil yang cocok dengan kata kunci "${searchTerm}"`
                            : "Belum ada paket kegiatan yang didaftarkan pada program ini."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedActivities.map((act, index) => {
                    const pctKeu = act.pagu > 0 ? (act.realisasi / act.pagu) * 100 : 0;
                    return (
                      <tr
                        key={act.id}
                        className="hover:bg-slate-50/90 transition-colors"
                      >
                        <td className="py-3 px-3 text-center text-slate-400 font-semibold text-[11px]">
                          {index + 1}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block whitespace-nowrap">
                            {act.kode}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-900 leading-snug">
                            {act.nama}
                          </p>
                          {act.uraian && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              {act.uraian}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <Badge
                            text={act.jenis}
                            color={act.jenis === "APBN" ? "blue" : "gold"}
                          />
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-medium text-slate-800 block">
                            {act.pj || "Belum Ditugaskan"}
                          </span>
                          {act.email && (
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {act.email}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                          {fmtRupiah(act.pagu)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-800 whitespace-nowrap">
                          {fmtRupiah(act.realisasi)}
                        </td>
                        <td className="py-3 px-3 min-w-[130px]">
                          <ProgressBar
                            value={pctKeu}
                            color={pctKeu >= 70 ? "#236437" : pctKeu >= 40 ? "#E2A917" : "#C0392B"}
                          />
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800 whitespace-nowrap">
                          {act.fisik !== undefined ? `${act.fisik}%` : "—"}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {act.statusAnggaran === "Diblokir" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Diblokir
                            </span>
                          ) : act.sudahLapor ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Sudah Lapor
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Belum Lapor
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 text-center sm:text-left">
              Menampilkan <span className="font-bold text-slate-800">{displayedActivities.length}</span> dari{" "}
              <span className="font-bold text-slate-800">{programActivities.length}</span> kegiatan pada program{" "}
              <span className="font-bold text-slate-800">"{programName}"</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate("master");
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-[#134B88] hover:text-white bg-blue-50 hover:bg-[#134B88] border border-blue-200 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={Icons.table} />
                  </svg>
                  Kelola di Master Kegiatan
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ProgramDetailModal;
