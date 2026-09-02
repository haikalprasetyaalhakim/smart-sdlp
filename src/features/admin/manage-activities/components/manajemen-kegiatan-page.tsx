"use client";

import { Badge } from "@/components/KpiCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  createKegiatan,
  deleteKegiatan,
  updateKegiatan,
} from "@/features/kegiatan/actions";
import { fmtRupiah, Icons } from "@/utils/formatters";
import {
  MAIN_PROGRAM_CATEGORIES,
  PROGRAM_COLORS,
  resolveProgramCategory,
} from "@/utils/programCategorization";
import { useRouter } from "next/navigation";
import React, { useMemo, useState, useTransition } from "react";

type KegiatanFromDb = {
  id: string;
  kode: string;
  nama: string;
  jenis: "APBN" | "NON_APBN";
  programCategory: string | null;
  pagu: number;
  realisasi: number;
  fisik: number | null;
  uraian: string | null;
  statusAnggaran: "DIBUKA" | "DIBLOKIR";
  realLalu: number | null;
  realIni: number | null;
  wajib: boolean;
  sudahLapor: boolean;
  pjId: string | null;
  pj: { id: string; name: string; email: string } | null;
};

type PjOption = { id: string; name: string; email: string };

interface ManajemenKegiatanPageProps {
  initialKegiatan: KegiatanFromDb[];
  pjOptions: PjOption[];
}

export function ManajemenKegiatanPage({
  initialKegiatan,
  pjOptions,
}: ManajemenKegiatanPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"wajib" | "master">("master");

  const kegiatanDb = initialKegiatan;

  const [wajibState, setWajibState] = useState<Record<string, boolean>>(
    Object.fromEntries(kegiatanDb.map((k) => [k.id, k.wajib])),
  );

  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("ALL");

  // Modal Add / Edit State
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formKode, setFormKode] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formPjId, setFormPjId] = useState<string>(pjOptions[0]?.id ?? "");
  const [formJenis, setFormJenis] = useState<"APBN" | "NON_APBN">("APBN");
  const [formPagu, setFormPagu] = useState("500000000");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<KegiatanFromDb | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openAdd = () => {
    setEditId(null);
    setFormError(null);
    setFormKode("7912.SDA.015.051A");
    setFormNama("");
    setFormPjId(pjOptions[0]?.id ?? "");
    setFormJenis("APBN");
    setFormPagu("450000000");
    setFormCategory("");
    setModalOpen(true);
  };

  const openEdit = (k: KegiatanFromDb) => {
    setEditId(k.id);
    setFormError(null);
    setFormKode(k.kode);
    setFormNama(k.nama);
    setFormPjId(k.pjId ?? pjOptions[0]?.id ?? "");
    setFormJenis(k.jenis);
    setFormPagu(String(k.pagu));
    setFormCategory(k.programCategory ?? "");
    setModalOpen(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formKode.trim() || !formNama.trim()) return;
    if (!formCategory) {
      setFormError("Pilih kategori program utama terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      const result = editId
        ? await updateKegiatan({
            id: editId,
            kode: formKode,
            nama: formNama,
            jenis: formJenis,
            programCategory: formCategory,
            pagu: Number(formPagu),
            pjId: formPjId || undefined,
          })
        : await createKegiatan({
            kode: formKode,
            nama: formNama,
            jenis: formJenis,
            programCategory: formCategory,
            pagu: Number(formPagu),
            pjId: formPjId || undefined,
          });

      if (!result.success) {
        setFormError(result.error);
        return;
      }

      showToast(
        editId
          ? `Kegiatan "${result.kegiatan.kode}" berhasil diperbarui (Kategori: ${formCategory})`
          : `Kegiatan "${result.kegiatan.kode}" berhasil disimpan (Kategori: ${formCategory})`,
      );
      setModalOpen(false);
      router.refresh();
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;

    startTransition(async () => {
      const result = await deleteKegiatan(target.id);

      if (!result.success) {
        showToast(`❌ Gagal menghapus: ${result.error}`);
        setDeleteTarget(null);
        return;
      }

      showToast(`Kegiatan "${target.nama}" berhasil dihapus.`);
      setDeleteTarget(null);
      router.refresh();
    });
  };
  const filteredKegiatan = useMemo(() => {
    return kegiatanDb.filter((k) => {
      const matchSearch =
        k.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (k.pj?.name ?? "").toLowerCase().includes(searchTerm.toLowerCase());

      const currentCategory = resolveProgramCategory(
        k.kode,
        k.nama,
        k.programCategory ?? undefined,
      );
      const matchCategory =
        selectedCategoryFilter === "ALL" ||
        currentCategory === selectedCategoryFilter;

      return matchSearch && matchCategory;
    });
  }, [kegiatanDb, searchTerm, selectedCategoryFilter]);

  const totalWajib = Object.values(wajibState).filter(Boolean).length;
  const sudahLapor = kegiatanDb.filter(
    (k) => wajibState[k.id] && k.sudahLapor,
  ).length;
  const belumLapor = totalWajib - sudahLapor;

  return (
    <>
      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
                Manajemen Kegiatan & Auto-Grouping Program DIPA
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                Tersambung Database
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Penetapan kewajiban lapor, auto-kategorisasi kode DIPA
              (6918/7911/7912)
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d={Icons.input} />
              </svg>
              Tambah Kegiatan Baru
            </button>
          </div>
        </div>

        {toastMessage && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs">
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-emerald-800 hover:text-emerald-950 p-1 cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        )}

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
              1. Master Data Seluruh Kegiatan ({kegiatanDb.length} Kegiatan
              Terdaftar)
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

          {activeTab === "master" && (
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Cari kode, nama, atau PJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="h-8 px-2.5 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-700 cursor-pointer"
                >
                  <option value="ALL">
                    Semua Program ({kegiatanDb.length})
                  </option>
                  <option value="Layanan Perkantoran">
                    Layanan Perkantoran
                  </option>
                  <option value="Fasilitas Kinerja">Fasilitas Kinerja</option>
                  <option value="Klinik Modernisasi/KMP">
                    Klinik Modernisasi/KMP
                  </option>
                  <option value="Alat & Sarana">Alat & Sarana</option>
                  <option value="Program Lainnya/Unassigned">
                    Program Lainnya / Unassigned
                  </option>
                </select>
              </div>

              <div className="overflow-x-auto w-full border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3">Kode Kegiatan</th>
                      <th className="py-2.5 px-3 min-w-[200px]">
                        Nama Kegiatan
                      </th>
                      <th className="py-2.5 px-3 min-w-[180px]">
                        Program Utama
                      </th>
                      <th className="py-2.5 px-3">Jenis</th>
                      <th className="py-2.5 px-3">PJ & Kontak</th>
                      <th className="py-2.5 px-3 text-right">Pagu (Rp)</th>
                      <th className="py-2.5 px-3 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredKegiatan.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-8 text-center text-slate-400"
                        >
                          Tidak ada data kegiatan yang cocok dengan kriteria
                          filter.
                        </td>
                      </tr>
                    ) : (
                      filteredKegiatan.map((k, idx) => {
                        const category = resolveProgramCategory(
                          k.kode,
                          k.nama,
                          k.programCategory ?? undefined,
                        );
                        const catColor = PROGRAM_COLORS[category] || "#64748B";
                        return (
                          <tr
                            key={k.id}
                            className="hover:bg-slate-50/80 transition"
                          >
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
                                <span className="text-[11px] font-semibold text-slate-800">
                                  {category}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <Badge
                                text={k.jenis}
                                color={k.jenis === "APBN" ? "blue" : "gold"}
                              />
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="font-semibold text-slate-800">
                                {k.pj?.name ?? "-"}
                              </span>
                              <span className="text-[11px] text-slate-400 block">
                                {k.pj?.email ?? "-"}
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
                                  title="Edit Kegiatan (belum tersambung DB)"
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
                                  onClick={() => setDeleteTarget(k)}
                                  disabled={isPending}
                                  className="p-1.5 text-slate-500 hover:text-rose-700 rounded hover:bg-slate-100 cursor-pointer disabled:opacity-50"
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
            </div>
          )}

          {activeTab === "wajib" && (
            <div className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    TOTAL WAJIB LAPOR
                  </p>
                  <p className="text-2xl font-bold text-slate-800">
                    {totalWajib}
                  </p>
                </div>
                <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs">
                  <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-1">
                    SUDAH LAPOR
                  </p>
                  <p className="text-2xl font-bold text-emerald-800">
                    {sudahLapor}
                  </p>
                </div>
                <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs">
                  <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">
                    BELUM LAPOR
                  </p>
                  <p className="text-2xl font-bold text-amber-800">
                    {belumLapor}
                  </p>
                </div>
              </div>

              {/* Tabel wajib lapor: struktur sama seperti sebelumnya, checkbox masih local state (belum persisten) */}
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
                    {kegiatanDb.map((k) => (
                      <tr
                        key={k.id}
                        className="hover:bg-slate-50/80 transition"
                      >
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(wajibState[k.id])}
                            onChange={(e) =>
                              setWajibState({
                                ...wajibState,
                                [k.id]: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-emerald-800 rounded border-slate-300 focus:ring-emerald-700 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                          {k.kode}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {k.nama}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 block">
                            {k.pj?.name ?? "-"}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {k.pj?.email ?? "-"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium whitespace-nowrap">
                          {fmtRupiah(Number(k.pagu))}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge
                            text={
                              k.sudahLapor ? "Sudah Upload" : "Belum Upload"
                            }
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
                  Centang kotak untuk menetapkan kegiatan sebagai kewajiban
                  lapor bulanan. (Belum tersimpan ke database)
                </span>
                <button
                  onClick={() =>
                    showToast(
                      "⚠️ Penyimpanan kewajiban lapor belum tersambung ke database di PR ini.",
                    )
                  }
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-md transition cursor-pointer shadow-xs"
                >
                  Simpan Penetapan Kewajiban
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Add Kegiatan ── */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h3 className="text-sm font-bold text-slate-800">
                  {editId
                    ? "Edit Data Kegiatan & Kategori Program"
                    : "Tambah Kegiatan Baru ke DIPA"}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={handleSaveActivity}
                className="p-5 space-y-3.5 text-xs"
              >
                {formError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-md p-2.5">
                    {formError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Kode Kegiatan (DIPA)
                  </label>
                  <input
                    type="text"
                    required
                    value={formKode}
                    onChange={(e) => setFormKode(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-md font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Nama Kegiatan
                  </label>
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-md"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Kategori Program Utama{" "}
                    <span className="text-rose-600">*</span>
                  </label>
                  <select
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-9 px-2 text-xs bg-white border border-slate-300 rounded-md font-semibold text-slate-800"
                  >
                    <option value="" disabled>
                      — Pilih kategori —
                    </option>
                    {MAIN_PROGRAM_CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="Program Lainnya/Unassigned">
                      Program Lainnya / Unassigned
                    </option>
                  </select>
                  {formCategory && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            PROGRAM_COLORS[formCategory] || "#64748B",
                        }}
                      />
                      <span className="text-[11px] text-slate-500">
                        {formCategory}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      PJ Kegiatan
                    </label>
                    <select
                      value={formPjId}
                      onChange={(e) => setFormPjId(e.target.value)}
                      className="w-full h-9 px-2 text-xs bg-white border border-slate-300 rounded-md"
                    >
                      <option value="">— Tanpa PJ —</option>
                      {pjOptions.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      Jenis Anggaran
                    </label>
                    <select
                      value={formJenis}
                      onChange={(e) =>
                        setFormJenis(e.target.value as "APBN" | "NON_APBN")
                      }
                      className="w-full h-9 px-2 text-xs bg-white border border-slate-300 rounded-md"
                    >
                      <option value="APBN">APBN</option>
                      <option value="NON_APBN">NON-APBN</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Pagu Anggaran (Rp)
                  </label>
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
                    disabled={isPending}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white rounded-md font-semibold cursor-pointer shadow-xs"
                  >
                    {isPending ? "Menyimpan..." : "Simpan & Sinkronkan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kegiatan?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus kegiatan{" "}
              <span className="font-semibold text-slate-900">
                {`${deleteTarget?.nama}`}
              </span>{" "}
              (kode: {deleteTarget?.kode}). Tindakan ini tidak bisa dibatalkan
              dan akan menghapus data secara permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-rose-700 hover:bg-rose-800 focus:ring-rose-700"
            >
              {isPending ? "Menghapus..." : "Ya, Hapus Kegiatan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
