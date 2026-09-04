"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Icons } from "@/utils/formatters";
import {
  createDokumenWithFormData,
  deleteDokumen,
} from "@/features/repositori/actions";

export interface DokumenItem {
  id: string;
  nama: string;
  kategori: string;
  kegiatan: string;
  kegiatanId: string | null;
  tanggal: string;
  ukuran: string;
  uploader: string;
  fileUrl: string | null;
}

interface RepositoriPageProps {
  docs: DokumenItem[];
  stats: {
    total: number;
    sk: number;
    dipa: number;
    laporan: number;
  };
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
  };
  kegiatanOptions: { id: string; kode: string; nama: string }[];
  currentParams: {
    q: string;
    kategori: string;
    sort: string;
    order: string;
  };
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

function getDirectDownloadUrl(fileUrl: string | null): string | null {
  if (!fileUrl) return null;

  // 1. Google Drive File: /file/d/FILE_ID/...
  const driveFileMatch = fileUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${driveFileMatch[1]}`;
  }

  // 2. Google Drive Open Link: ?id=FILE_ID
  const driveOpenMatch = fileUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveOpenMatch && driveOpenMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${driveOpenMatch[1]}`;
  }

  // 3. Google Docs (Auto Export PDF)
  const docMatch = fileUrl.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docMatch && docMatch[1]) {
    return `https://docs.google.com/document/d/${docMatch[1]}/export?format=pdf`;
  }

  // 4. Google Sheets (Auto Export Excel)
  const sheetMatch = fileUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetMatch && sheetMatch[1]) {
    return `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export?format=xlsx`;
  }

  // 5. Fallback ke URL asli
  return fileUrl;
}

export function RepositoriPage({
  docs,
  stats,
  pagination,
  kegiatanOptions,
  currentParams,
}: RepositoriPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(currentParams.q);

  // Modal Upload Form State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "link">("file");
  const [newTitle, setNewTitle] = useState("");
  const [newKat, setNewKat] = useState<
    "SK" | "DIPA" | "KONTRAK" | "LAPORAN" | "ESURAT" | "LAINNYA"
  >("SK");
  const [newDate, setNewDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [newKegiatanId, setNewKegiatanId] = useState("NONE");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customLink, setCustomLink] = useState("");

  // Modal Delete State
  const [deleteTarget, setDeleteTarget] = useState<DokumenItem | null>(null);

  const updateQueryParams = (
    updates: Record<string, string | number | null>,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "" || val === "ALL") {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  // Debounced search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== currentParams.q) {
        updateQueryParams({ q: searchInput.trim() || null, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleSort = (column: string) => {
    const isCurrentSort = currentParams.sort === column;
    const nextOrder =
      isCurrentSort && currentParams.order === "asc" ? "desc" : "asc";
    updateQueryParams({ sort: column, order: nextOrder, page: 1 });
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validasi Judul
    if (!newTitle.trim()) {
      toast.error("Judul dokumen wajib diisi.");
      return;
    }

    // 2. Validasi Mode Tautan Google Drive
    if (uploadMode === "link") {
      const gdrivePattern =
        /^https?:\/\/(drive\.google\.com\/(file\/d\/|drive\/folders\/|drive\/u\/\d+\/folders\/|open\?id=)|docs\.google\.com\/(document\/d\/|spreadsheets\/d\/|presentation\/d\/|forms\/d\/))[a-zA-Z0-9_-]+/i;

      if (!customLink.trim()) {
        toast.error("Tautan Google Drive wajib diisi.");
        return;
      }
      if (!gdrivePattern.test(customLink.trim())) {
        toast.error(
          "Format tautan Google Drive tidak valid! Pastikan diawali dengan https://drive.google.com/file/d/...",
        );
        return;
      }
    }

    // 3. Validasi Mode Unggah Berkas File
    if (uploadMode === "file" && !selectedFile) {
      toast.error("Pilih berkas dokumen yang ingin diunggah.");
      return;
    }

    // 4. Siapkan Data Form
    const formData = new FormData();
    formData.append("nama", newTitle.trim());
    formData.append("kategori", newKat);
    formData.append("tanggal", newDate);
    formData.append(
      "kegiatanId",
      newKegiatanId !== "NONE" ? newKegiatanId : "",
    );
    formData.append("uploadMode", uploadMode);

    if (uploadMode === "link") {
      formData.append("customLink", customLink.trim());
    } else if (selectedFile) {
      formData.append("file", selectedFile);
    }

    // 5. Eksekusi Server Action
    startTransition(async () => {
      const res = await createDokumenWithFormData(formData);

      if (res.success) {
        toast.success("Dokumen berhasil disimpan ke repositori!");
        setShowUploadModal(false);
        setNewTitle("");
        setSelectedFile(null);
        setCustomLink("");
        setNewKegiatanId("NONE");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal mengunggah dokumen.");
      }
    });
  };

  const handleDeleteSubmit = () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      const res = await deleteDokumen(deleteTarget.id);
      if (res.success) {
        toast.success(`Dokumen "${deleteTarget.nama}" berhasil dihapus.`);
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus dokumen.");
      }
    });
  };

  const getKatBadgeClass = (kat: string) => {
    switch (kat) {
      case "DIPA":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "SK":
        return "bg-sky-50 text-sky-800 border-sky-200";
      case "KONTRAK":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "LAPORAN":
        return "bg-rose-50 text-rose-800 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
            Repositori Pengarsipan Dokumen Resmi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pusat penyimpanan SK, DIPA, Kontrak, Laporan SMART, dan Surat Dinas
            BRMP SDLAHAN (Terintegrasi Google Drive)
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
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
            <path d={Icons.upload} />
          </svg>
          Upload Dokumen Baru
        </button>
      </div>

      {/* ── Stats Summary ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            TOTAL DOKUMEN
          </p>
          <p className="text-2xl font-black text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-sky-700 uppercase tracking-wider mb-1">
            SK / PENUGASAN
          </p>
          <p className="text-2xl font-black text-sky-600">{stats.sk}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
            DIPA & POK
          </p>
          <p className="text-2xl font-black text-emerald-600">{stats.dipa}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1">
            LAPORAN SMART
          </p>
          <p className="text-2xl font-black text-rose-600">{stats.laporan}</p>
        </div>
      </div>

      {/* ── Search, Filters, and Table ── */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Cari judul dokumen, kegiatan, atau pengunggah..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={currentParams.kategori}
              onChange={(e) =>
                updateQueryParams({
                  kategori: e.target.value === "ALL" ? null : e.target.value,
                  page: 1,
                })
              }
              className="h-8 px-2.5 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-700 cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="SK">SK / Surat Tugas</option>
              <option value="DIPA">DIPA / POK</option>
              <option value="KONTRAK">Kontrak / SPK</option>
              <option value="LAPORAN">Laporan SMART</option>
              <option value="ESURAT">E-Surat</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th
                  onClick={() => handleSort("nama")}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center gap-1">
                    Judul Dokumen
                    {currentParams.sort === "nama" && (
                      <span>{currentParams.order === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Kegiatan Terkait</th>
                <th
                  onClick={() => handleSort("tanggal")}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center gap-1">
                    Tanggal
                    {currentParams.sort === "tanggal" && (
                      <span>{currentParams.order === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-4">Ukuran / Tipe</th>
                <th className="py-3 px-4">Pengunggah</th>
                <th className="py-3 px-4 text-center">Aksi & Berkas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada berkas dokumen yang cocok dengan kriteria
                    pencarian.
                  </td>
                </tr>
              ) : (
                docs.map((doc, idx) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 text-slate-400 font-semibold text-center">
                      {(pagination.page - 1) * pagination.pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-[280px]">
                      {doc.fileUrl ? (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-emerald-900 hover:text-emerald-700 hover:underline flex items-center gap-1.5 group"
                          title="Buka Dokumen di Google Drive"
                        >
                          <span className="truncate">{doc.nama}</span>
                          <span className="text-[10px] text-emerald-600 opacity-70 group-hover:opacity-100">
                            ↗
                          </span>
                        </a>
                      ) : (
                        <span
                          className="truncate block font-semibold"
                          title={doc.nama}
                        >
                          {doc.nama}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold border ${getKatBadgeClass(doc.kategori)}`}
                      >
                        {doc.kategori}
                      </span>
                    </td>
                    <td
                      className="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-[200px] truncate"
                      title={doc.kegiatan}
                    >
                      {doc.kegiatan}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {doc.tanggal}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                        {doc.ukuran}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-medium">
                      {doc.uploader}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 text-[11px] font-semibold transition"
                            title="Buka Berkas di Google Drive"
                          >
                            <span>Drive</span>
                            <span className="text-[10px]">↗</span>
                          </a>
                        )}

                        <button
                          title="Hapus Dokumen"
                          onClick={() => setDeleteTarget(doc)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 cursor-pointer transition inline-flex items-center justify-center"
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="p-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
          <span>
            Menampilkan <b className="text-slate-800">{docs.length}</b> dari{" "}
            <b className="text-slate-800">{pagination.total}</b> total berkas
            dokumen
          </span>

          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => updateQueryParams({ page: pagination.page - 1 })}
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
                      onClick={() => updateQueryParams({ page: p })}
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
                onClick={() => updateQueryParams({ page: pagination.page + 1 })}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-md border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                aria-label="Halaman berikutnya"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Upload Dokumen Hybrid ── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                Unggah Dokumen Resmi ke Repositori
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d={Icons.close} />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleUploadSubmit}
              className="p-5 space-y-4 text-xs"
            >
              {/* Toggle Mode Hybrid */}
              <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setUploadMode("file")}
                  className={`flex-1 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                    uploadMode === "file"
                      ? "bg-white text-emerald-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  📁 Unggah Berkas File (Auto GDrive)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("link")}
                  className={`flex-1 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                    uploadMode === "link"
                      ? "bg-white text-emerald-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🔗 Tempel Tautan Google Drive
                </button>
              </div>

              {/* Upload Berkas File */}
              {uploadMode === "file" && (
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800">
                    Pilih File Dokumen
                  </label>
                  <div className="border-2 border-dashed border-slate-300 hover:border-emerald-700 bg-slate-50/50 hover:bg-emerald-50/30 rounded-lg p-4 text-center transition cursor-pointer relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.jpg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedFile(file);
                        if (file && !newTitle) {
                          // Auto isi nama jika belum diisi
                          const cleanName = file.name.replace(/\.[^/.]+$/, "");
                          setNewTitle(cleanName);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-1 text-slate-500">
                      <svg
                        width={24}
                        height={24}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-emerald-700"
                      >
                        <path d={Icons.upload} />
                      </svg>
                      {selectedFile ? (
                        <div className="text-emerald-900 font-bold">
                          <p className="text-xs">{selectedFile.name}</p>
                          <p className="text-[10px] text-slate-500 font-normal">
                            {(selectedFile.size / 1024).toFixed(0)} KB • Klik
                            untuk mengganti berkas
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="font-semibold text-slate-700">
                            Klik atau seret berkas ke sini
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Format PDF, DOCX, XLSX, ZIP (Maks. 50MB)
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tempel Tautan Link GDrive */}
              {uploadMode === "link" && (
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800">
                    Tautan / URL Berkas Google Drive{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    required={uploadMode === "link"}
                    placeholder="https://drive.google.com/file/d/.../view"
                    value={customLink}
                    onChange={(e) => setCustomLink(e.target.value)}
                    className={`w-full p-2.5 text-xs bg-white border rounded-md focus:outline-none focus:ring-1 font-mono ${
                      customLink.trim() &&
                      !/^https?:\/\/(drive\.google\.com\/(file\/d\/|drive\/folders\/|drive\/u\/\d+\/folders\/|open\?id=)|docs\.google\.com\/(document\/d\/|spreadsheets\/d\/|presentation\/d\/|forms\/d\/))[a-zA-Z0-9_-]+/i.test(
                        customLink.trim(),
                      )
                        ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20 text-rose-900"
                        : "border-slate-300 focus:ring-emerald-800"
                    }`}
                  />
                  {customLink.trim() &&
                  !/^https?:\/\/(drive\.google\.com\/(file\/d\/|drive\/folders\/|drive\/u\/\d+\/folders\/|open\?id=)|docs\.google\.com\/(document\/d\/|spreadsheets\/d\/|presentation\/d\/|forms\/d\/))[a-zA-Z0-9_-]+/i.test(
                    customLink.trim(),
                  ) ? (
                    <p className="text-[10.5px] text-rose-600 font-medium">
                      ⚠️ Tautan tidak valid. Format harus berupa link Google
                      Drive atau Google Docs resmi.
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      Contoh: https://drive.google.com/file/d/1a2b3c.../view
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">
                  Judul Dokumen <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SK Penugasan Tim SMART SDLAHAN 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800">
                    Kategori
                  </label>
                  <select
                    value={newKat}
                    onChange={(e) => setNewKat(e.target.value as any)}
                    className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-800 cursor-pointer"
                  >
                    <option value="SK">SK / Surat Tugas</option>
                    <option value="DIPA">DIPA / POK</option>
                    <option value="KONTRAK">Kontrak / SPK</option>
                    <option value="LAPORAN">Laporan SMART</option>
                    <option value="ESURAT">E-Surat</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800">
                    Tanggal Dokumen
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">
                  Kegiatan Terkait (Opsional)
                </label>
                <select
                  value={newKegiatanId}
                  onChange={(e) => setNewKegiatanId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-800 cursor-pointer"
                >
                  <option value="NONE">
                    Dokumen Umum (Tidak Terkait Kegiatan Spesifik)
                  </option>
                  {kegiatanOptions.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.kode} — {k.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || !newTitle.trim()}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-md font-semibold cursor-pointer shadow-xs transition inline-flex items-center gap-2"
                >
                  {isPending && (
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  {isPending ? "Mengunggah..." : "Simpan Dokumen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Konfirmasi Hapus Dokumen ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
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
                  Hapus Dokumen?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Apakah Anda yakin ingin menghapus dokumen{" "}
                  <strong>&quot;{deleteTarget.nama}&quot;</strong>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isPending}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isPending}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-md transition cursor-pointer shadow-xs"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
