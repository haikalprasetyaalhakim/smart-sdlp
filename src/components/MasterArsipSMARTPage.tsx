import React, { useState } from "react";
import { smartArsipData, auditLogData } from "@/data/mockData";
import { SmartArchiveItem } from "@/types";
import { Icons } from "@/utils/formatters";
import { Badge } from "./KpiCard";

interface MasterArsipSMARTPageProps {
  onNavigateToAudit?: () => void;
}

export function MasterArsipSMARTPage({ onNavigateToAudit }: MasterArsipSMARTPageProps) {
  const [items, setItems] = useState<SmartArchiveItem[]>(smartArsipData);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [filterBulan, setFilterBulan] = useState("Semua Periode");

  // Deletion Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SmartArchiveItem | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteNotification, setDeleteNotification] = useState(true);
  const [successToast, setSuccessToast] = useState("");

  const openDeleteModal = (item: SmartArchiveItem) => {
    setSelectedItem(item);
    setDeleteReason("");
    setDeleteNotification(true);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedItem || !deleteReason.trim()) return;

    // Remove from active archive
    setItems(items.filter((i) => i.id !== selectedItem.id));

    // Push into audit log
    auditLogData.unshift({
      id: auditLogData.length + 1,
      waktu: "Baru saja, " + new Date().toLocaleTimeString("id-ID") + " WIB",
      namaFile: `Laporan SMART ${selectedItem.periode} - ${selectedItem.kode}.xlsx`,
      kegiatan: `${selectedItem.kode} ${selectedItem.nama}`,
      pemilik: selectedItem.uploader,
      emailPemilik: selectedItem.email,
      admin: "Admin Pusdatin",
      alasan: deleteReason,
      notif: deleteNotification ? "Terkirim ke User" : "Tidak Dikirim",
    });

    setDeleteModalOpen(false);
    setSuccessToast(`Laporan "${selectedItem.nama}" berhasil dihapus dan dicatat dalam Log Audit.`);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const filtered = items.filter((item) => {
    const matchSearch =
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      item.kode.toLowerCase().includes(search.toLowerCase()) ||
      item.uploader.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Semua Status" || item.status === filterStatus;
    const matchBulan = filterBulan === "Semua Periode" || item.periode === filterBulan;
    return matchSearch && matchStatus && matchBulan;
  });

  const totalItem = items.length;
  const sudahUpload = items.filter((i) => i.status === "Sudah Upload").length;
  const belumUpload = items.filter((i) => i.status === "Belum Upload").length;

  return (
    <div className="space-y-5">
      {/* ── Top Header ── */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
            Master Pengarsipan Laporan SMART
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Repositori terpusat berkas laporan realisasi SMART yang diunggah oleh seluruh PJ Kegiatan
          </p>
        </div>
        {onNavigateToAudit && (
          <button
            onClick={onNavigateToAudit}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition cursor-pointer"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={Icons.shield} />
            </svg>
            Lihat Log Audit Penghapusan
          </button>
        )}
      </div>

      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast("")} className="text-emerald-900 hover:text-emerald-950 p-1 cursor-pointer">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            TOTAL ARSIP SMART
          </p>
          <p className="text-2xl font-bold text-slate-800">{totalItem}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            SUDAH TERUNGGAH
          </p>
          <p className="text-2xl font-bold text-emerald-600">{sudahUpload}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            BELUM DIUNGGAH
          </p>
          <p className="text-2xl font-bold text-rose-600">{belumUpload}</p>
        </div>
      </div>

      {/* ── Search & Filter Table ── */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Cari kode, nama kegiatan, atau pengunggah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={Icons.search} />
              </svg>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterBulan}
              onChange={(e) => setFilterBulan(e.target.value)}
              className="h-9 px-3 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-700"
            >
              <option value="Semua Periode">Semua Periode</option>
              <option value="Agustus 2026">Agustus 2026</option>
              <option value="Juli 2026">Juli 2026</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 px-3 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-700"
            >
              <option value="Semua Status">Semua Status</option>
              <option value="Sudah Upload">Sudah Upload</option>
              <option value="Belum Upload">Belum Upload</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">Kode & Kegiatan</th>
                <th className="py-2.5 px-3">Periode</th>
                <th className="py-2.5 px-3">Jenis</th>
                <th className="py-2.5 px-3">Pengunggah (PJ)</th>
                <th className="py-2.5 px-3">Waktu Upload</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 text-slate-400 font-semibold">{idx + 1}</td>
                  <td className="py-2.5 px-3 max-w-[260px]">
                    <span className="font-mono text-[11px] font-semibold text-emerald-800 block">
                      {item.kode}
                    </span>
                    <span className="font-medium text-slate-900">{item.nama}</span>
                  </td>
                  <td className="py-2.5 px-3 font-medium whitespace-nowrap">{item.periode}</td>
                  <td className="py-2.5 px-3">
                    <Badge text={item.jenis} color={item.jenis === "APBN" ? "blue" : "gold"} />
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-800 block">{item.uploader}</span>
                    <span className="text-[11px] text-slate-400">{item.email}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{item.waktu}</td>
                  <td className="py-2.5 px-3 text-center">
                    <Badge
                      text={item.status}
                      color={item.status === "Sudah Upload" ? "green" : "red"}
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {item.status === "Sudah Upload" ? (
                        <>
                          <button
                            title="Unduh Berkas SMART"
                            onClick={() => alert(`Mengunduh laporan SMART ${item.nama}...`)}
                            className="p-1 text-slate-500 hover:text-emerald-700 rounded hover:bg-slate-100 cursor-pointer"
                          >
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d={Icons.download} />
                            </svg>
                          </button>
                          <button
                            title="Hapus Laporan (Masuk Log Audit)"
                            onClick={() => openDeleteModal(item)}
                            className="p-1 text-slate-500 hover:text-rose-700 rounded hover:bg-slate-100 cursor-pointer"
                          >
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d={Icons.trash} />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => alert(`Mengirimkan email pengingat kepada ${item.uploader} (${item.email})...`)}
                          className="px-2 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition cursor-pointer"
                        >
                          Ingatkan PJ
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Deletion with Required Reason & Audit Trail ── */}
      {deleteModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2 text-rose-800">
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={Icons.trash} />
                </svg>
                <h3 className="text-sm font-bold">Hapus Laporan SMART (Audit Trail Aktif)</h3>
              </div>
              <button onClick={() => setDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                <p className="font-semibold text-slate-800">{selectedItem.nama}</p>
                <p className="text-slate-500">
                  Kode: <span className="font-mono">{selectedItem.kode}</span> · Periode: {selectedItem.periode}
                </p>
                <p className="text-slate-500">
                  Pemilik Data: <span className="font-semibold">{selectedItem.uploader}</span> ({selectedItem.email})
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">
                  Alasan Penghapusan Dokumen <span className="text-rose-600">* Wajib Diisi</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan alasan penghapusan secara transparan (contoh: File revisi perbaikan angka serapan dari PJ atau file duplikat)..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
                <p className="text-[11px] text-slate-400">
                  Alasan ini akan disimpan permanen di Log Audit dan dikirimkan ke email PJ terkait.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={deleteNotification}
                  onChange={(e) => setDeleteNotification(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Kirimkan email notifikasi otomatis beserta alasan penghapusan ke PJ Kegiatan
              </label>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!deleteReason.trim()}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white rounded-md font-semibold cursor-pointer shadow-xs transition"
                >
                  Konfirmasi Hapus Dokumen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
