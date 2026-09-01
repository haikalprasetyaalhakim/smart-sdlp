import React, { useState } from "react";
import { allArchiveDocs, allKegiatan } from "@/data/mockData";
import { ArchiveDocument } from "@/types";
import { Icons } from "@/utils/formatters";
import { Badge } from "./KpiCard";

export function RepositoriPage() {
  const [docs, setDocs] = useState<ArchiveDocument[]>(allArchiveDocs);
  const [search, setSearch] = useState("");
  const [filterKat, setFilterKat] = useState("Semua Kategori");
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("2026-08-20");
  const [newKat, setNewKat] = useState<ArchiveDocument["kategori"]>("SK");
  const [newKegiatan, setNewKegiatan] = useState("—");

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newDoc: ArchiveDocument = {
      id: docs.length + 1,
      nama: newTitle,
      kategori: newKat,
      tanggal: newDate,
      ukuran: "1.4 MB",
      uploader: "User PJ Kegiatan",
      kegiatan: newKegiatan !== "—" ? newKegiatan : "—",
    };
    setDocs([newDoc, ...docs]);
    setShowUploadModal(false);
    setNewTitle("");
  };

  const filtered = docs.filter((d) => {
    const matchSearch =
      d.nama.toLowerCase().includes(search.toLowerCase()) ||
      (d.kegiatan && d.kegiatan.toLowerCase().includes(search.toLowerCase()));
    const matchKat = filterKat === "Semua Kategori" || d.kategori === filterKat;
    return matchSearch && matchKat;
  });

  const getKatColor = (kat: string): "green" | "blue" | "gold" | "gray" | "red" => {
    switch (kat) {
      case "DIPA":
        return "green";
      case "SK":
        return "blue";
      case "Kontrak":
        return "gold";
      case "Laporan":
        return "red";
      default:
        return "gray";
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
            Pusat penyimpanan SK, DIPA, Kontrak, Laporan SMART, dan Surat Dinas BRMP SDLAHAN
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d={Icons.upload} />
          </svg>
          + Upload Dokumen Baru
        </button>
      </div>

      {/* ── Stats Summary ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "TOTAL DOKUMEN", val: docs.length, color: "text-slate-800" },
          { label: "SK / PENUGASAN", val: docs.filter((d) => d.kategori === "SK").length, color: "text-sky-600" },
          { label: "DIPA & POK", val: docs.filter((d) => d.kategori === "DIPA").length, color: "text-emerald-600" },
          { label: "LAPORAN SMART", val: docs.filter((d) => d.kategori === "Laporan").length, color: "text-rose-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* ── Search, Filters, and Table ── */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Cari judul dokumen atau kode..."
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
              value={filterKat}
              onChange={(e) => setFilterKat(e.target.value)}
              className="h-9 px-3 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-700 w-full sm:w-auto"
            >
              <option value="Semua Kategori">Semua Kategori</option>
              <option value="SK">SK / Surat Tugas</option>
              <option value="DIPA">DIPA / POK</option>
              <option value="Kontrak">Kontrak / SPK</option>
              <option value="Laporan">Laporan SMART</option>
              <option value="E-Surat">E-Surat</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">Judul Dokumen</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3">Kegiatan Terkait</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Ukuran</th>
                <th className="py-2.5 px-3">Pengunggah</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.map((doc, idx) => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 text-slate-400 font-semibold">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[280px]">
                    <span className="truncate block" title={doc.nama}>
                      {doc.nama}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge text={doc.kategori} color={getKatColor(doc.kategori)} />
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                    {doc.kegiatan || "—"}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{doc.tanggal}</td>
                  <td className="py-2.5 px-3 text-slate-500">{doc.ukuran}</td>
                  <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{doc.uploader}</td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        title="Unduh Berkas"
                        onClick={() => alert(`Mengunduh berkas ${doc.nama}...`)}
                        className="p-1 text-slate-500 hover:text-emerald-700 rounded hover:bg-slate-100 cursor-pointer"
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d={Icons.download} />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Upload ── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">Upload Dokumen Arsip Baru</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Judul Dokumen <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SK Penugasan Tim Teknis Lahan Rawa 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Kategori <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newKat}
                    onChange={(e) => setNewKat(e.target.value as any)}
                    className="w-full h-9 px-2 text-xs bg-white border border-slate-300 rounded-md"
                  >
                    <option value="SK">SK / Surat Tugas</option>
                    <option value="DIPA">DIPA / POK</option>
                    <option value="Kontrak">Kontrak / SPK</option>
                    <option value="Laporan">Laporan SMART</option>
                    <option value="E-Surat">E-Surat</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Tanggal Dokumen <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full h-9 px-2 text-xs bg-white border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Kegiatan Terkait (Opsional)</label>
                <select
                  value={newKegiatan}
                  onChange={(e) => setNewKegiatan(e.target.value)}
                  className="w-full h-9 px-2 text-xs bg-white border border-slate-300 rounded-md"
                >
                  <option value="—">— Tidak Terikat Kegiatan Tertentu —</option>
                  {allKegiatan.map((k) => (
                    <option key={k.kode} value={k.kode}>
                      {k.kode} — {k.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Pilih Berkas (PDF / DOCX / XLSX)
                </label>
                <div className="border border-dashed border-slate-300 rounded-md p-4 text-center bg-slate-50">
                  <p className="text-slate-600 font-medium">Klik untuk memilih berkas</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Maksimal ukuran 25MB</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md font-semibold cursor-pointer shadow-xs"
                >
                  Unggah Dokumen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
