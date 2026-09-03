"use client";

import Link from "next/link";
import { Activity } from "@/types";
import { fmtRupiah, Icons } from "@/utils/formatters";
import { KpiCard, Badge, ProgressBar } from "./KpiCard";

interface UserDashboardProps {
  activities: Activity[];
}

export function UserDashboard({ activities }: UserDashboardProps) {
  const totalPagu = activities.reduce((a, b) => a + b.pagu, 0);
  const totalReal = activities.reduce((a, b) => a + b.realisasi, 0);
  const avgFisik = activities.length
    ? activities.reduce((a, b) => a + (b.fisik || 0), 0) / activities.length
    : 0;
  const sisaAnggaran = totalPagu - totalReal;
  const persenSerapan = totalPagu > 0 ? (totalReal / totalPagu) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
            Dashboard Capaian Kegiatan & Anggaran
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Penanggung Jawab Kegiatan · Balai Besar Perakitan dan Modernisasi
            Sumber Daya Lahan Pertanian (TA 2026)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/input"
            className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md text-xs font-semibold shadow-xs transition cursor-pointer"
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
            + Isi Laporan
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Pagu Kegiatan"
          value={fmtRupiah(totalPagu)}
          sub={`Total ${activities.length} kegiatan ditugaskan`}
          accent="#134B88"
          icon={Icons.dashboard}
        />
        <KpiCard
          label="Realisasi Keuangan"
          value={fmtRupiah(totalReal)}
          sub={`Serapan Anggaran: ${persenSerapan.toFixed(1)}%`}
          accent="#236437"
          icon={Icons.excel}
        />
        <KpiCard
          label="Sisa Anggaran"
          value={fmtRupiah(sisaAnggaran)}
          sub="Tersedia untuk periode berjalan"
          accent="#E2A917"
          icon={Icons.consolidate}
        />
        <KpiCard
          label="Rata-rata Fisik"
          value={`${avgFisik.toFixed(1)}%`}
          sub="Capaian target output fisik"
          accent="#C0392B"
          icon={Icons.checkbox}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Daftar Kegiatan Dalam Tanggung Jawab
              </h3>
              <p className="text-xs text-slate-500">
                Status pelaporan realisasi keuangan SMART & fisik bulan berjalan
              </p>
            </div>
          </div>

          <div className="overflow-x-auto w-full flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Kode & Nama Kegiatan</th>
                  <th className="py-2.5 px-3">Jenis</th>
                  <th className="py-2.5 px-3 text-right">Pagu</th>
                  <th className="py-2.5 px-3 text-right">Realisasi</th>
                  <th className="py-2.5 px-3">Serapan Keuangan</th>
                  <th className="py-2.5 px-3 text-center">Fisik</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Belum ada kegiatan yang ditugaskan kepada Anda.
                    </td>
                  </tr>
                ) : (
                  activities.map((act) => {
                    const pctKeu =
                      act.pagu > 0 ? (act.realisasi / act.pagu) * 100 : 0;
                    return (
                      <tr
                        key={act.id}
                        className="hover:bg-slate-50/80 transition"
                      >
                        <td className="py-3 px-3 max-w-[220px]">
                          <span className="text-[11px] font-semibold text-emerald-800 font-mono block">
                            {act.kode}
                          </span>
                          <span className="font-medium text-slate-900 line-clamp-2">
                            {act.nama}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            text={act.jenis}
                            color={act.jenis === "APBN" ? "blue" : "gold"}
                          />
                        </td>
                        <td className="py-3 px-3 text-right font-medium whitespace-nowrap">
                          {fmtRupiah(act.pagu)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-800 whitespace-nowrap">
                          {fmtRupiah(act.realisasi)}
                        </td>
                        <td className="py-3 px-3 min-w-[140px]">
                          <ProgressBar value={pctKeu} color="#236437" />
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-800">
                          {act.fisik}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge
                            text={
                              act.status === "done"
                                ? "Selesai Lapor"
                                : "Belum Lapor"
                            }
                            color={act.status === "done" ? "green" : "red"}
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Link
                            href={`/input?kode=${encodeURIComponent(act.kode)}`}
                            className="inline-block px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition cursor-pointer"
                          >
                            Lapor
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              Jadwal & Deadline Pelaporan
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-md text-amber-900">
                <span className="text-amber-700 shrink-0 mt-0.5">
                  <svg
                    width={15}
                    height={15}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </span>
                <div>
                  <p className="font-bold">Batas Akhir Pelaporan SMART</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Tanggal 25 setiap bulan pukul 23:59 WIB. Mohon segera input
                    realisasi.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700">
                <p className="font-semibold text-slate-900">
                  Panduan Pengisian
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  1. Download template Excel atau isi via Form Web Direct.
                  <br />
                  2. Masukkan nominal realisasi periode berjalan &amp; capaian
                  fisik.
                  <br />
                  3. Identitas Penanggung Jawab otomatis tervalidasi dari sesi
                  login.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/input"
                className="block w-full py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md text-xs font-bold text-center transition cursor-pointer shadow-xs"
              >
                Mulai Isi Laporan Realisasi
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
