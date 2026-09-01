import React, { useState, useMemo } from "react";
import { allKegiatan, daftarUser } from "@/data/mockData";
import { Activity } from "@/types";
import { fmtRupiah, Icons } from "@/utils/formatters";
import {
  MAIN_PROGRAM_CATEGORIES,
  PROGRAM_COLORS,
  resolveProgramCategory,
} from "@/utils/programCategorization";
import { Badge } from "./KpiCard";

interface ManajemenKegiatanPageProps {
  activities?: Activity[];
  onUpdateActivities?: (activities: Activity[]) => void;
}

export function ManajemenKegiatanPage({
  activities: initialActivities = allKegiatan,
  onUpdateActivities,
}: ManajemenKegiatanPageProps) {
  const [activeTab, setActiveTab] = useState<"wajib" | "master">("master");
  const [kegiatanList, setKegiatanList] = useState<Activity[]>(initialActivities);
  const [wajibState, setWajibState] = useState<Record<number, boolean>>(
    Object.fromEntries(
      initialActivities.map((k) => [
        k.id,
        k.sudahLapor || [1, 2, 4, 6, 7, 9, 10, 12, 13, 14, 15, 16].includes(k.id),
      ])
    )
  );

  // Filter & Search state in Master Data
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");

  // Modal Add / Edit State
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formKode, setFormKode] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formPj, setFormPj] = useState(daftarUser[0]);
  const [formEmail, setFormEmail] = useState("");
  const [formJenis, setFormJenis] = useState<"APBN" | "NON-APBN">("APBN");
  const [formPagu, setFormPagu] = useState("500000000");
  const [formCategoryMode, setFormCategoryMode] = useState<"AUTO" | string>("AUTO");

  // Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state upward when kegiatanList changes
  const updateActivitiesList = (newList: Activity[]) => {
    setKegiatanList(newList);
    if (onUpdateActivities) {
      onUpdateActivities(newList);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openAdd = () => {
    setEditId(null);
    setFormKode("7912.SDA.015.051A");
    setFormNama("");
    setFormPj(daftarUser[0]);
    setFormEmail("budi.santoso@pertanian.go.id");
    setFormJenis("APBN");
    setFormPagu("450000000");
    setFormCategoryMode("AUTO");
    setModalOpen(true);
  };

  const openEdit = (k: Activity) => {
    setEditId(k.id);
    setFormKode(k.kode);
    setFormNama(k.nama);
    setFormPj(k.pj || daftarUser[0]);
    setFormEmail(k.email || "");
    setFormJenis(k.jenis);
    setFormPagu(String(k.pagu));
    setFormCategoryMode(k.programCategory || "AUTO");
    setModalOpen(true);
  };

  // Compute live auto-categorized result for the form
  const detectedCategory = useMemo(() => {
    if (formCategoryMode !== "AUTO") {
      return formCategoryMode;
    }
    return resolveProgramCategory(formKode, formNama);
  }, [formKode, formNama, formCategoryMode]);

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKode.trim() || !formNama.trim()) return;

    const finalCategory =
      formCategoryMode === "AUTO"
        ? resolveProgramCategory(formKode, formNama)
        : formCategoryMode;

    if (editId) {
      const updated = kegiatanList.map((k) =>
        k.id === editId
          ? {
              ...k,
              kode: formKode,
              nama: formNama,
              pj: formPj,
              email: formEmail,
              jenis: formJenis,
              programCategory: finalCategory,
              pagu: Number(formPagu),
            }
          : k
      );
      updateActivitiesList(updated);
      showToast(`Kegiatan "${formKode}" berhasil diperbarui (Kategori: ${finalCategory})`);
    } else {
      const newId = Math.max(...kegiatanList.map((k) => k.id), 0) + 1;
      const newActivity: Activity = {
        id: newId,
        kode: formKode,
        nama: formNama,
        pj: formPj,
        email: formEmail,
        jenis: formJenis,
        programCategory: finalCategory,
        pagu: Number(formPagu),
        statusAnggaran: "Dibuka",
        uraian: "Kegiatan baru telah didaftarkan dalam DIPA TA 2026.",
        fisik: 0,
        realLalu: 0,
        realIni: 0,
        realisasi: 0,
        sudahLapor: false,
        wajib: true,
      };
      const nextList = [...kegiatanList, newActivity];
      updateActivitiesList(nextList);
      setWajibState((prev) => ({ ...prev, [newId]: true }));
      showToast(`Kegiatan baru berhasil ditambahkan dan otomatis dikelompokkan ke "${finalCategory}"!`);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: number) => {
    const act = kegiatanList.find((k) => k.id === id);
    if (confirm(`Apakah Anda yakin ingin menghapus kegiatan "${act?.nama || id}"?`)) {
      const updated = kegiatanList.filter((k) => k.id !== id);
      updateActivitiesList(updated);
      showToast("Data kegiatan berhasil dihapus.");
    }
  };

  // Quick Inline Category Switcher
  const handleQuickCategoryChange = (id: number, newCategory: string) => {
    const updated = kegiatanList.map((k) =>
      k.id === id ? { ...k, programCategory: newCategory } : k
    );
    updateActivitiesList(updated);
    showToast(`Kategori kegiatan dialihkan ke "${newCategory}"`);
  };

  // Batch Data Import Simulation (DIPA / Excel Upload)
  const handleImportSampleBatch = (batchType: "sample1" | "sample2") => {
    let newItems: Array<{
      kode: string;
      nama: string;
      jenis: "APBN" | "NON-APBN";
      pagu: number;
      pj: string;
      programCategory?: string;
    }> = [];

    if (batchType === "sample1") {
      newItems = [
        {
          kode: "6918.EBA.994.004A",
          nama: "Penyediaan Daya Listrik & Jaringan Fiber Optic Laboratorium",
          jenis: "NON-APBN",
          pagu: 650000000,
          pj: "Rudi Hartono",
        },
        {
          kode: "7911.CAG.008.051A",
          nama: "Pengadaan Alat Sentrifugasi Berkecepatan Tinggi Analisis Tanah",
          jenis: "APBN",
          pagu: 850000000,
          pj: "Dani Firmansyah",
        },
        {
          kode: "7912.SDA.016.051A",
          nama: "Klinik Kesuburan Lahan dan Uji Cepat Hara Sawah Rawa",
          jenis: "APBN",
          pagu: 520000000,
          pj: "Nina Kusuma",
        },
      ];
    } else {
      newItems = [
        {
          kode: "6918.EBA.962.053A",
          nama: "Fasilitas Penguatan SPIP & Reformasi Birokrasi Balai",
          jenis: "NON-APBN",
          pagu: 480000000,
          pj: "Dewi Lestari",
        },
        {
          kode: "7911.CAG.009.051A",
          nama: "Pengadaan GPS Geodetik RTK untuk Pemetaan Topografi Mikro",
          jenis: "APBN",
          pagu: 420000000,
          pj: "Budi Santoso",
        },
        {
          kode: "9999.UNK.001.000A",
          nama: "Kegiatan Khusus Kemitraan Antar-Lembaga Internasional",
          jenis: "NON-APBN",
          pagu: 300000000,
          pj: "Siti Rahayu",
        },
      ];
    }

    let maxId = Math.max(...kegiatanList.map((k) => k.id), 0);
    const addedActivities: Activity[] = newItems.map((item) => {
      maxId += 1;
      const resolved = resolveProgramCategory(item.kode, item.nama, item.programCategory);
      return {
        id: maxId,
        kode: item.kode,
        nama: item.nama,
        jenis: item.jenis,
        pagu: item.pagu,
        realisasi: Math.round(item.pagu * 0.45),
        fisik: 50,
        pj: item.pj,
        email: `${item.pj.toLowerCase().replace(/\s+/g, ".")}@pertanian.go.id`,
        programCategory: resolved,
        statusAnggaran: "Dibuka",
        sudahLapor: true,
        wajib: true,
        uraian: "Kegiatan hasil integrasi DIPA baru TA 2026.",
      };
    });

    const nextFullList = [...kegiatanList, ...addedActivities];
    updateActivitiesList(nextFullList);

    // Build breakdown summary for feedback
    const breakdown = addedActivities.map(
      (a) => `• ${a.kode} (${fmtRupiah(a.pagu)}) -> Auto-group: "${a.programCategory}"`
    );
    setImportFeedback(
      `Berhasil mengimpor ${addedActivities.length} kegiatan baru!\n\n` +
        breakdown.join("\n") +
        `\n\nDonut Chart "Distribusi Pagu Per Program" langsung diperbarui secara otomatis!`
    );
  };

  // Filtered Master Data Table
  const filteredKegiatan = useMemo(() => {
    return kegiatanList.filter((k) => {
      const matchSearch =
        k.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (k.pj && k.pj.toLowerCase().includes(searchTerm.toLowerCase()));

      const currentCategory = resolveProgramCategory(k.kode, k.nama, k.programCategory);
      const matchCategory =
        selectedCategoryFilter === "ALL" || currentCategory === selectedCategoryFilter;

      return matchSearch && matchCategory;
    });
  }, [kegiatanList, searchTerm, selectedCategoryFilter]);

  const totalWajib = Object.values(wajibState).filter(Boolean).length;
  const sudahLapor = kegiatanList.filter((k) => wajibState[k.id] && k.sudahLapor).length;
  const belumLapor = totalWajib - sudahLapor;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
              Manajemen Kegiatan & Auto-Grouping Program DIPA
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              Dinamis Real-Time
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Penetapan kewajiban lapor, auto-kategorisasi kode DIPA (6918/7911/7912), dan sinkronisasi agregasi Donut Chart
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setImportFeedback(null);
              setImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-md text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d={Icons.excel} />
            </svg>
            Import Data DIPA / Excel
          </button>

          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d={Icons.input} />
            </svg>
            + Tambah Kegiatan Baru
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs">
              ✓
            </span>
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-800 hover:text-emerald-950 p-1 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Auto-Grouping Logic Info Banner ── */}
      <div className="bg-slate-100/90 border border-slate-200/90 rounded-lg p-3.5 text-xs text-slate-700">
        <div className="flex items-start gap-2.5">
          <span className="text-base mt-0.5">ℹ️</span>
          <div className="space-y-1">
            <p className="font-bold text-slate-900">
              Sistem Auto-Grouping & Fallback 4 Program Utama:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-[11.5px]">
              <div className="p-2 bg-white rounded border border-blue-200">
                <span className="font-bold text-[#134B88] block">● Layanan Perkantoran</span>
                <span className="text-slate-500 text-[10.5px]">Prefix 6918 (Gaji/Ops Gedung)</span>
              </div>
              <div className="p-2 bg-white rounded border border-emerald-200">
                <span className="font-bold text-[#236437] block">● Fasilitas Kinerja</span>
                <span className="text-slate-500 text-[10.5px]">Prefix 6918 (SAKIP/Monev)</span>
              </div>
              <div className="p-2 bg-white rounded border border-amber-200">
                <span className="font-bold text-[#E28B59] block">● Klinik Modernisasi/KMP</span>
                <span className="text-slate-500 text-[10.5px]">Prefix 7912 (Lahan/Pemupukan)</span>
              </div>
              <div className="p-2 bg-white rounded border border-purple-200">
                <span className="font-bold text-[#8E44AD] block">● Alat & Sarana</span>
                <span className="text-slate-500 text-[10.5px]">Prefix 7911 (Lab/Drone/Sensor)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs Container ── */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 gap-2">
          <button
            onClick={() => setActiveTab("master")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === "master"
                ? "border-emerald-700 text-emerald-800 bg-white shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            1. Master Data Seluruh Kegiatan ({kegiatanList.length} Kegiatan Terdaftar)
          </button>
          <button
            onClick={() => setActiveTab("wajib")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === "wajib"
                ? "border-emerald-700 text-emerald-800 bg-white shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            2. Penetapan Kewajiban Lapor ({totalWajib} Wajib)
          </button>
        </div>

        {/* ── TAB 1: Master Data & Dynamic Categories ── */}
        {activeTab === "master" && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Toolbar Search & Program Filter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Cari kode, nama, atau PJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
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
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end overflow-x-auto">
                <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                  Filter Program:
                </span>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="h-8 px-2.5 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer"
                >
                  <option value="ALL">Semua Program ({kegiatanList.length})</option>
                  <option value="Layanan Perkantoran">Layanan Perkantoran</option>
                  <option value="Fasilitas Kinerja">Fasilitas Kinerja</option>
                  <option value="Klinik Modernisasi/KMP">Klinik Modernisasi/KMP</option>
                  <option value="Alat & Sarana">Alat & Sarana</option>
                  <option value="Program Lainnya/Unassigned">Program Lainnya / Unassigned</option>
                </select>
              </div>
            </div>

            {/* Master Table */}
            <div className="overflow-x-auto w-full border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-10 text-center">No</th>
                    <th className="py-2.5 px-3">Kode Kegiatan</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Nama Kegiatan</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Program Utama (Auto-Group)</th>
                    <th className="py-2.5 px-3">Jenis</th>
                    <th className="py-2.5 px-3">PJ & Kontak</th>
                    <th className="py-2.5 px-3 text-right">Pagu (Rp)</th>
                    <th className="py-2.5 px-3 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredKegiatan.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada data kegiatan yang cocok dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    filteredKegiatan.map((k, idx) => {
                      const category = resolveProgramCategory(k.kode, k.nama, k.programCategory);
                      const catColor = PROGRAM_COLORS[category] || "#64748B";

                      return (
                        <tr key={k.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 text-slate-400 font-semibold text-center text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {k.kode}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {k.nama}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: catColor }}
                              />
                              <select
                                value={category}
                                onChange={(e) => handleQuickCategoryChange(k.id, e.target.value)}
                                className="text-[11px] font-semibold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
                                title="Klik untuk mengubah program secara langsung"
                              >
                                {MAIN_PROGRAM_CATEGORIES.map((c) => (
                                  <option key={c.name} value={c.name}>
                                    {c.name}
                                  </option>
                                ))}
                                <option value="Program Lainnya/Unassigned">
                                  Program Lainnya/Unassigned
                                </option>
                              </select>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <Badge text={k.jenis} color={k.jenis === "APBN" ? "blue" : "gold"} />
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="font-semibold text-slate-800 block">{k.pj}</span>
                            <span className="text-[10.5px] text-slate-400 block font-mono">
                              {k.email}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                            {fmtRupiah(k.pagu)}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEdit(k)}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 rounded hover:bg-slate-100 cursor-pointer"
                                title="Edit Kegiatan"
                              >
                                <svg
                                  width={14}
                                  height={14}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d={Icons.edit} />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(k.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-700 rounded hover:bg-slate-100 cursor-pointer"
                                title="Hapus Kegiatan"
                              >
                                <svg
                                  width={14}
                                  height={14}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d={Icons.trash} />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>
                Menampilkan <b className="text-slate-800">{filteredKegiatan.length}</b> dari{" "}
                <b className="text-slate-800">{kegiatanList.length}</b> total kegiatan master.
              </span>
              <span className="text-[11px] text-emerald-800 font-medium">
                Setiap perubahan langsung disinkronkan ke Donut Chart Distribusi Pagu!
              </span>
            </div>
          </div>
        )}

        {/* ── TAB 2: Penetapan Wajib Lapor ── */}
        {activeTab === "wajib" && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  TOTAL WAJIB LAPOR
                </p>
                <p className="text-2xl font-bold text-slate-800">{totalWajib}</p>
              </div>
              <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs">
                <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-1">
                  SUDAH LAPOR
                </p>
                <p className="text-2xl font-bold text-emerald-800">{sudahLapor}</p>
              </div>
              <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs">
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">
                  BELUM LAPOR
                </p>
                <p className="text-2xl font-bold text-amber-800">{belumLapor}</p>
              </div>
            </div>

            <div className="overflow-x-auto w-full border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-12 text-center">Wajib</th>
                    <th className="py-2.5 px-3">Kode Kegiatan</th>
                    <th className="py-2.5 px-3">Nama Kegiatan</th>
                    <th className="py-2.5 px-3">PJ & Kontak</th>
                    <th className="py-2.5 px-3 text-right">Pagu (Rp)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {kegiatanList.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(wajibState[k.id])}
                          onChange={(e) => {
                            setWajibState({ ...wajibState, [k.id]: e.target.checked });
                          }}
                          className="w-4 h-4 text-emerald-800 rounded border-slate-300 focus:ring-emerald-700 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                        {k.kode}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{k.nama}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{k.pj}</span>
                        <span className="text-[11px] text-slate-400 block">{k.email}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium whitespace-nowrap">
                        {fmtRupiah(k.pagu)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge
                          text={k.sudahLapor ? "Sudah Upload" : "Belum Upload"}
                          color={k.sudahLapor ? "green" : "red"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Centang kotak untuk menetapkan kegiatan sebagai kewajiban lapor bulanan.
              </span>
              <button
                onClick={() => showToast("Perubahan status kewajiban pelaporan berhasil disimpan!")}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-md transition cursor-pointer shadow-xs"
              >
                Simpan Penetapan Kewajiban
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Add / Edit Activity ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {editId ? "Edit Data Kegiatan & Kategori Program" : "Tambah Kegiatan Baru ke DIPA"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Kode Kegiatan (DIPA)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 7912.SDA.015.051A atau 6918.EBA.994.001A"
                  value={formKode}
                  onChange={(e) => setFormKode(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-md font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Nama Kegiatan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengujian Lapangan Hara Tanah Gambut"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-md"
                />
              </div>

              {/* Kategori Program Utama Auto-Mapping & Manual Override */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">
                    Kategori Program Utama
                  </label>
                  <span className="text-[10px] text-slate-500">Mapping 4 Program</span>
                </div>

                <select
                  value={formCategoryMode}
                  onChange={(e) => setFormCategoryMode(e.target.value)}
                  className="w-full h-9 px-2 text-xs bg-white border border-slate-300 rounded-md font-semibold text-slate-800"
                >
                  <option value="AUTO">🤖 Auto-Detect (Otomatis berdasarkan Prefix Kode / Nama)</option>
                  <option value="Layanan Perkantoran">Layanan Perkantoran (Kode 6918 / Gaji / Ops)</option>
                  <option value="Fasilitas Kinerja">Fasilitas Kinerja (Kode 6918 / Monev / SAKIP)</option>
                  <option value="Klinik Modernisasi/KMP">Klinik Modernisasi/KMP (Kode 7912 / Lahan / Pupuk)</option>
                  <option value="Alat & Sarana">Alat & Sarana (Kode 7911 / Lab / Drone / Sensor)</option>
                  <option value="Program Lainnya/Unassigned">Program Lainnya / Unassigned</option>
                </select>

                {/* Live Preview of Detection */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Hasil Pengelompokan:
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold text-white shadow-2xs"
                    style={{ backgroundColor: PROGRAM_COLORS[detectedCategory] || "#64748B" }}
                  >
                    ● {detectedCategory}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">PJ Kegiatan</label>
                  <select
                    value={formPj}
                    onChange={(e) => setFormPj(e.target.value)}
                    className="w-full h-9 px-2 text-xs bg-white border border-slate-300 rounded-md"
                  >
                    {daftarUser.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Jenis Anggaran</label>
                  <select
                    value={formJenis}
                    onChange={(e) => setFormJenis(e.target.value as any)}
                    className="w-full h-9 px-2 text-xs bg-white border border-slate-300 rounded-md"
                  >
                    <option value="APBN">APBN</option>
                    <option value="NON-APBN">NON-APBN</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Pagu Anggaran (Rp)</label>
                <input
                  type="number"
                  required
                  value={formPagu}
                  onChange={(e) => setFormPagu(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-md font-mono font-bold"
                />
                <p className="text-[11px] text-slate-500 font-medium">
                  {fmtRupiah(Number(formPagu))}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md font-semibold cursor-pointer shadow-xs"
                >
                  Simpan & Sinkronkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Batch Import (DIPA / Excel Upload Simulation) ── */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-base">📊</span>
                <h3 className="text-sm font-bold text-slate-800">
                  Import Data DIPA / Spreadsheet Baru
                </h3>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Sistem secara otomatis akan memproses baris-baris kegiatan dari file DIPA dan
                mengaitkannya ke 4 Program Utama berdasarkan 4-digit awal kode atau kata kunci nama
                kegiatan.
              </p>

              {importFeedback ? (
                <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-lg text-emerald-900 space-y-3 font-mono text-[11px] whitespace-pre-line">
                  {importFeedback}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50 space-y-2">
                    <p className="font-bold text-slate-800">Batch 1: DIPA Revisi 01 (3 Paket)</p>
                    <ul className="text-[11px] text-slate-500 space-y-1">
                      <li>• 6918.EBA (Daya Listrik & FO)</li>
                      <li>• 7911.CAG (Sentrifugasi Lab)</li>
                      <li>• 7912.SDA (Klinik Kesuburan)</li>
                    </ul>
                    <button
                      onClick={() => handleImportSampleBatch("sample1")}
                      className="w-full mt-2 py-1.5 bg-[#134B88] hover:bg-[#0f3c6d] text-white rounded text-xs font-semibold transition cursor-pointer"
                    >
                      Impor Batch 1
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50 space-y-2">
                    <p className="font-bold text-slate-800">Batch 2: DIPA Hibah & SAKIP (3 Paket)</p>
                    <ul className="text-[11px] text-slate-500 space-y-1">
                      <li>• 6918.EBA (Penguatan SPIP)</li>
                      <li>• 7911.CAG (GPS Geodetik RTK)</li>
                      <li>• 9999.UNK (Kemitraan Luar)</li>
                    </ul>
                    <button
                      onClick={() => handleImportSampleBatch("sample2")}
                      className="w-full mt-2 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded text-xs font-semibold transition cursor-pointer"
                    >
                      Impor Batch 2
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManajemenKegiatanPage;
