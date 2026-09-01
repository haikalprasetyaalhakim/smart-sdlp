import React, { useState } from "react";
import { auditLogData } from "@/data/mockData";
import { Icons } from "@/utils/formatters";
import { Badge } from "./KpiCard";

export function LogAuditPage() {
  const [search, setSearch] = useState("");

  const filtered = auditLogData.filter(
    (row) =>
      row.namaFile.toLowerCase().includes(search.toLowerCase()) ||
      row.kegiatan.toLowerCase().includes(search.toLowerCase()) ||
      row.pemilik.toLowerCase().includes(search.toLowerCase()) ||
      row.alasan.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* ── Top Header ── */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
            Log Riwayat Audit Penghapusan Laporan SMART
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan transparan seluruh tindakan penghapusan berkas oleh administrator sistem
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert("Mengekspor Log Audit ke Excel...")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition cursor-pointer"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={Icons.excel} />
            </svg>
            Ekspor Excel
          </button>
        </div>
      </div>

      {/* ── Search & Table ── */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Cari nama file, kegiatan, atau alasan..."
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
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">Waktu Penghapusan</th>
                <th className="py-2.5 px-3">Nama Berkas & Kegiatan</th>
                <th className="py-2.5 px-3">Pemilik Data (PJ)</th>
                <th className="py-2.5 px-3">Dihapus Oleh</th>
                <th className="py-2.5 px-3">Alasan Penghapusan</th>
                <th className="py-2.5 px-3 text-center">Status Notifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.map((row, idx) => (
                <tr key={row.id} className="hover:bg-amber-50/40 transition">
                  <td className="py-2.5 px-3 text-slate-400 font-semibold">{idx + 1}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-semibold text-rose-700 block">{row.waktu.split(",")[0]}</span>
                    <span className="text-[11px] text-slate-400">{row.waktu.split(",")[1]}</span>
                  </td>
                  <td className="py-2.5 px-3 max-w-[240px]">
                    <span className="font-semibold text-slate-900 block truncate">{row.namaFile}</span>
                    <span className="text-[11px] text-slate-500 line-clamp-1">{row.kegiatan}</span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-800 block">{row.pemilik}</span>
                    <span className="text-[11px] text-slate-400">{row.emailPemilik}</span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-800 block">{row.admin}</span>
                    <span className="text-[10px] text-slate-400">Admin Pusdatin</span>
                  </td>
                  <td className="py-2.5 px-3 max-w-[280px]">
                    <p className="italic text-slate-600 leading-relaxed bg-slate-50 p-2 rounded border border-slate-200">
                      "{row.alasan}"
                    </p>
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <Badge text="Terkirim ke Email" color="green" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filtered.length} catatan riwayat penghapusan</span>
          <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Log audit diamankan secara read-only dan tidak dapat diubah
          </span>
        </div>
      </div>
    </div>
  );
}
