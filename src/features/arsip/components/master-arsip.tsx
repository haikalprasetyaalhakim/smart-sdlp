"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { fmtRupiah, Icons } from "@/utils/formatters";
import { deleteLaporan } from "@/features/arsip/actions";

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);

  return pages;
}

export interface ArsipItem {
  id: string;
  kegiatanId: string;
  kode: string;
  nama: string;
  periode: string;
  periodeBulan: number;
  periodeTahun: number;
  tanggal: string;
  pagu: number;
  realisasi: number;
  realIni: number;
  fisik: number;
  statusAnggaran: "DIBUKA" | "DIBLOKIR";
  uploader: string;
  email: string;
  nip: string;
  uraian: string;
}

interface MasterArsipSMARTPageProps {
  arsipList: ArsipItem[];
  stats: {
    totalArsip: number;
    totalKegiatan: number;
    kegiatanSudahLapor: number;
    kegiatanBelumLapor: number;
  };
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
  };
  periodOptions: { value: string; label: string }[];
  currentParams: {
    q: string;
    periode: string;
    status: string;
    sort: string;
    order: string;
  };
}

export function MasterArsipSMARTPage({
  arsipList,
  stats,
  pagination,
  periodOptions,
  currentParams,
}: MasterArsipSMARTPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchValue, setSearchValue] = useState(currentParams.q);

  // Deletion Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ArsipItem | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const updateQueryParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "" || val === "ALL") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueryParams({ q: searchValue.trim(), page: "1" });
  };

  const handleSort = (column: string) => {
    const isCurrentSort = currentParams.sort === column;
    const nextOrder =
      isCurrentSort && currentParams.order === "asc" ? "desc" : "asc";
    updateQueryParams({ sort: column, order: nextOrder, page: "1" });
  };

  const openDeleteModal = (item: ArsipItem) => {
    setSelectedItem(item);
    setDeleteReason("");
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedItem) return;
    if (!deleteReason.trim()) {
      toast.error("Alasan penghapusan wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await deleteLaporan(selectedItem.id, deleteReason.trim());
      if (res.success) {
        toast.success(
          `Laporan "${selectedItem.nama}" periode ${selectedItem.periode} berhasil dihapus.`,
        );
        setDeleteModalOpen(false);
        setSelectedItem(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus laporan.");
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* ── Top Header ── */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
            Master Pengarsipan Laporan SMART
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Repositori terpusat berkas & input laporan realisasi SMART yang
            diinput oleh seluruh PJ Kegiatan
          </p>
        </div>
        <Link
          href="/admin/log-audit"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition cursor-pointer"
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d={Icons.shield} />
          </svg>
          Lihat Log Audit Penghapusan
        </Link>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            TOTAL LAPORAN MASUK
          </p>
          <p className="text-2xl font-black text-slate-800">
            {stats.totalArsip}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            TOTAL KEGIATAN
          </p>
          <p className="text-2xl font-black text-emerald-800">
            {stats.totalKegiatan}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
            KEGIATAN SUDAH LAPOR
          </p>
          <p className="text-2xl font-black text-emerald-600">
            {stats.kegiatanSudahLapor}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1">
            BELUM LAPOR
          </p>
          <p className="text-2xl font-black text-rose-600">
            {stats.kegiatanBelumLapor}
          </p>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <form
            onSubmit={handleSearchSubmit}
            className="relative w-full sm:w-80"
          >
            <input
              type="text"
              placeholder="Cari kode, kegiatan, atau PJ... (Tekan Enter)"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full h-8.5 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-800"
            />
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-2.5 top-2.5 text-slate-400"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={currentParams.periode}
              onChange={(e) =>
                updateQueryParams({ periode: e.target.value, page: "1" })
              }
              className="h-8.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-800 cursor-pointer text-slate-700 font-medium"
            >
              <option value="ALL">Semua Periode</option>
              {periodOptions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>

            <select
              value={currentParams.status}
              onChange={(e) =>
                updateQueryParams({ status: e.target.value, page: "1" })
              }
              className="h-8.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-800 cursor-pointer text-slate-700 font-medium"
            >
              <option value="ALL">Semua Status</option>
              <option value="DIBUKA">Anggaran Dibuka</option>
              <option value="DIBLOKIR">Anggaran Diblokir</option>
            </select>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th
                  onClick={() => handleSort("kode")}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center gap-1">
                    Kegiatan
                    {currentParams.sort === "kode" && (
                      <span>{currentParams.order === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("createdAt")}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center gap-1">
                    Periode
                    {currentParams.sort === "createdAt" && (
                      <span>{currentParams.order === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-4">Penanggung Jawab</th>
                <th
                  onClick={() => handleSort("realIni")}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    Realisasi Bulan Ini
                    {currentParams.sort === "realIni" && (
                      <span>{currentParams.order === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("realisasi")}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Akumulasi
                    {currentParams.sort === "realisasi" && (
                      <span>{currentParams.order === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("fisik")}
                  className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    Fisik
                    {currentParams.sort === "fisik" && (
                      <span>{currentParams.order === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {arsipList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada arsip laporan yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                arsipList.map((item) => {
                  const persen =
                    item.pagu > 0
                      ? ((item.realisasi / item.pagu) * 100).toFixed(1)
                      : "0.0";
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-emerald-900">
                          {item.kode}
                        </div>
                        <div
                          className="font-medium text-slate-800 max-w-xs truncate"
                          title={item.nama}
                        >
                          {item.nama}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {item.periode}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.tanggal}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {item.uploader}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {item.email}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                        {fmtRupiah(item.realIni)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">
                          {fmtRupiah(item.realisasi)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ({persen}% pagu)
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-slate-800">
                          {item.fisik}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {item.statusAnggaran === "DIBLOKIR" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Diblokir
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Dibuka
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => openDeleteModal(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded transition cursor-pointer"
                          title="Hapus / Reset Laporan"
                        >
                          <svg
                            width={12}
                            height={12}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d={Icons.trash} />
                          </svg>
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="p-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
          <span>
            Menampilkan <b className="text-slate-800">{arsipList.length}</b>{" "}
            dari <b className="text-slate-800">{pagination.total}</b> total
            arsip laporan
          </span>

          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() =>
                  updateQueryParams({ page: String(pagination.page - 1) })
                }
                className="px-2.5 py-1.5 text-xs font-semibold rounded-md border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                aria-label="Halaman sebelumnya"
              >
                ‹
              </button>

              {getPageNumbers(pagination.page, pagination.totalPages).map(
                (p, i) =>
                  p === "..." ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-2 text-xs text-slate-400 select-none"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => updateQueryParams({ page: String(p) })}
                      className={`min-w-7.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border cursor-pointer transition ${
                        p === pagination.page
                          ? "bg-emerald-800 border-emerald-800 text-white"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                      aria-current={p === pagination.page ? "page" : undefined}
                    >
                      {p}
                    </button>
                  ),
              )}

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  updateQueryParams({ page: String(pagination.page + 1) })
                }
                className="px-2.5 py-1.5 text-xs font-semibold rounded-md border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                aria-label="Halaman berikutnya"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Konfirmasi Hapus Laporan ── */}
      {deleteModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3 text-rose-600">
              <div className="p-2 bg-rose-100 rounded-full shrink-0">
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d={Icons.trash} />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Hapus Laporan Arsip SMART?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tindakan ini akan menghapus data realisasi periode{" "}
                  <strong>{selectedItem.periode}</strong> untuk kegiatan{" "}
                  <strong>{selectedItem.kode}</strong> serta dicatat di Log
                  Audit.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-md border border-slate-200 text-xs space-y-1">
              <div className="text-slate-600">
                <strong>Kegiatan:</strong> {selectedItem.nama}
              </div>
              <div className="text-slate-600">
                <strong>PJ:</strong> {selectedItem.uploader}
              </div>
              <div className="text-slate-600">
                <strong>Realisasi:</strong> {fmtRupiah(selectedItem.realIni)}{" "}
                (Fisik: {selectedItem.fisik}%)
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Alasan Penghapusan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Contoh: Kesalahan input nilai SP2D oleh PJ, diminta upload ulang."
                className="w-full p-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isPending}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isPending || !deleteReason.trim()}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-md transition cursor-pointer shadow-xs"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus Laporan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
