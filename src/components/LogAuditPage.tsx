"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export interface AuditLogItem {
  id: string;
  waktu: string;
  namaFile: string;
  kegiatan: string;
  pemilik: string;
  emailPemilik: string;
  admin: string;
  adminEmail: string;
  alasan: string;
  notif: string;
}

interface LogAuditPageProps {
  logs: AuditLogItem[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
  };
  currentSearch: string;
}

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

export function LogAuditPage({
  logs,
  pagination,
  currentSearch,
}: LogAuditPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentSearch);

  const updateQueryParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (!val) {
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

  return (
    <div className="space-y-5">
      {/* ── Top Header ── */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
            Log Riwayat Audit Penghapusan Laporan SMART
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan transparan seluruh tindakan penghapusan berkas & laporan
            oleh administrator sistem
          </p>
        </div>
        <Link
          href="/admin/arsip-sp2d"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition cursor-pointer"
        >
          ← Kembali ke Arsip Laporan
        </Link>
      </div>

      {/* ── Search Bar ── */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <form
            onSubmit={handleSearchSubmit}
            className="relative w-full sm:w-80"
          >
            <input
              type="text"
              placeholder="Cari nama berkas, kegiatan, atau alasan... (Enter)"
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
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Waktu Penghapusan</th>
                <th className="py-3 px-4">Nama Berkas & Kegiatan</th>
                <th className="py-3 px-4">Pemilik Data (PJ)</th>
                <th className="py-3 px-4">Dihapus Oleh</th>
                <th className="py-3 px-4">Alasan Penghapusan</th>
                <th className="py-3 px-4 text-center">Status Notifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada riwayat penghapusan berkas laporan.
                  </td>
                </tr>
              ) : (
                logs.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-amber-50/40 transition">
                    <td className="py-3 px-4 text-slate-400 font-semibold">
                      {(pagination.page - 1) * pagination.pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-rose-700 block">
                        {row.waktu.split(" ")[0]}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {row.waktu.split(" ").slice(1).join(" ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-[240px]">
                      <span className="font-semibold text-slate-900 block truncate">
                        {row.namaFile}
                      </span>
                      <span className="text-[11px] text-slate-500 line-clamp-1">
                        {row.kegiatan}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">
                        {row.pemilik}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {row.emailPemilik}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">
                        {row.admin}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {row.adminEmail}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-[280px]">
                      <p className="italic text-slate-600 leading-relaxed bg-slate-50 p-2 rounded border border-slate-200">
                        &quot;{row.alasan}&quot;
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {row.notif}
                      </span>
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
            Menampilkan <b className="text-slate-800">{logs.length}</b> dari{" "}
            <b className="text-slate-800">{pagination.total}</b> total riwayat
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
    </div>
  );
}
