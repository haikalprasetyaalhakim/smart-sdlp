"use client";

import React, { useState } from "react";
import { Activity } from "@/types";
import { fmtRupiah, Icons } from "@/utils/formatters";
import { KpiCard, Badge, ProgressBar } from "./KpiCard";
import { barData, lineDataFull } from "@/data/mockData";
import { Top5LowSerapanWidget } from "./Top5LowSerapanWidget";
import { DistribusiPaguWidget } from "./DistribusiPaguWidget";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

interface AdminDashboardProps {
  activities: Activity[];
}

export function AdminDashboard({ activities }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"serapan" | "trend" | "kegiatan">(
    "serapan",
  );
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState<"ALL" | "APBN" | "NON-APBN">(
    "ALL",
  );

  const totalPagu = activities.reduce((a, b) => a + b.pagu, 0);
  const totalReal = activities.reduce((a, b) => a + b.realisasi, 0);
  const totalWajib = activities.filter((a) => a.wajib).length;
  const sudahLapor = activities.filter((a) => a.wajib && a.sudahLapor).length;
  const belumLapor = totalWajib - sudahLapor;
  const persenSerapan = totalPagu > 0 ? (totalReal / totalPagu) * 100 : 0;
  const sisaAnggaran = totalPagu - totalReal;

  const filtered = activities.filter((a) => {
    const matchSearch =
      a.nama.toLowerCase().includes(search.toLowerCase()) ||
      a.kode.toLowerCase().includes(search.toLowerCase()) ||
      (a.pj && a.pj.toLowerCase().includes(search.toLowerCase()));
    const matchJenis = filterJenis === "ALL" || a.jenis === filterJenis;
    return matchSearch && matchJenis;
  });

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
            Executive Dashboard Monitoring Anggaran SMART
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Balai Besar Perakitan dan Modernisasi Sumber Daya Lahan Pertanian ·
            Tahun Anggaran 2026
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition cursor-pointer">
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d={Icons.users} />
            </svg>
            Kelola Kegiatan
          </button>
          <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md text-xs font-semibold shadow-xs transition cursor-pointer">
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d={Icons.print} />
            </svg>
            Cetak Dokumen &amp; Laporan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Pagu Anggaran (DIPA)"
          value={fmtRupiah(totalPagu)}
          sub="APBN & PNBP/BLU Terdaftar"
          accent="#134B88"
          icon={Icons.dashboard}
        />
        <KpiCard
          label="Total Realisasi Keuangan"
          value={fmtRupiah(totalReal)}
          sub={`Serapan Real: ${persenSerapan.toFixed(1)}%`}
          accent="#236437"
          icon={Icons.excel}
        />
        <KpiCard
          label="Sisa Anggaran Belum Terserap"
          value={fmtRupiah(sisaAnggaran)}
          sub="Posisi per Agustus 2026"
          accent="#E2A917"
          icon={Icons.consolidate}
        />
        <KpiCard
          label="Kepatuhan Pelaporan PJ"
          value={`${sudahLapor} / ${totalWajib} PJ`}
          sub={`${belumLapor} PJ Kegiatan Belum Lapor`}
          accent="#C0392B"
          icon={Icons.users}
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-slate-200/80 bg-slate-50/40">
          <div className="inline-flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 overflow-x-auto max-w-full">
            {[
              { id: "serapan", label: "Monitoring Serapan Anggaran" },
              { id: "trend", label: "Analisis Trend & Kurva-S" },
              { id: "kegiatan", label: "Daftar Kegiatan & Kepatuhan PJ" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`whitespace-nowrap cursor-pointer transition-all duration-150 ${
                  activeTab === t.id
                    ? "bg-white text-emerald-950 font-semibold shadow-sm rounded-lg px-4 py-2 text-xs"
                    : "text-slate-600 hover:text-slate-900 font-medium px-4 py-2 text-xs"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "serapan" && (
          <div className="p-4 sm:p-5 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 xl:col-span-8 bg-slate-50/70 rounded-xl p-5 sm:p-6 border border-slate-200 flex flex-col justify-between h-full min-h-[440px]">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block mb-0.5">
                        SERAPAN REALISASI
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                        Realisasi Bulanan APBN vs Non-APBN
                      </h4>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                      Jan – Agu 2026
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Perbandingan nominal belanja anggaran bulanan (dalam Miliar
                    Rp)
                  </p>
                </div>

                <div className="flex-1 w-full min-h-[260px] my-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 24, right: 16, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: "#475569" }}
                        axisLine={{ stroke: "#cbd5e1" }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[
                          0,
                          (dataMax: number) =>
                            Math.ceil((dataMax * 1.25) / 500000000) * 500000000,
                        ]}
                        tick={{ fontSize: 11, fill: "#475569" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${(v / 1e9).toFixed(1)}M`}
                      />
                      <Tooltip
                        formatter={(val: any) => [fmtRupiah(Number(val)), ""]}
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.08)",
                        }}
                      />
                      <Bar
                        dataKey="apbn_real"
                        name="Realisasi APBN"
                        fill="#236437"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      />
                      <Bar
                        dataKey="non_real"
                        name="Realisasi Non-APBN"
                        fill="#134B88"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 pt-3 border-t border-slate-200/80 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-[#236437]" />
                    <span>Realisasi APBN</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-[#134B88]" />
                    <span>Realisasi Non-APBN</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 xl:col-span-4 h-full">
                <DistribusiPaguWidget activities={activities} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "trend" && (
          <div className="p-4 sm:p-5 space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="bg-slate-50/60 rounded-lg p-5 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block mb-0.5">
                        TREN KUMULATIF
                      </span>
                      <h4 className="text-sm font-bold text-slate-800">
                        Kurva S Rencana Target vs Realisasi (%)
                      </h4>
                    </div>
                    <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/80">
                      On-Track (66.5% vs 66.7%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Pemantauan kurva S realisasi kumulatif bulanan dibandingkan
                    target rencana kerja.
                  </p>
                </div>
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={lineDataFull}
                      margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        unit="%"
                        domain={[0, 100]}
                      />
                      <Tooltip formatter={(val: any) => [`${val}%`, ""]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line
                        type="monotone"
                        dataKey="target"
                        name="Target Kumulatif (%)"
                        stroke="#134B88"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="realisasi"
                        name="Realisasi Aktual (%)"
                        stroke="#236437"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <Top5LowSerapanWidget />
            </div>
          </div>
        )}

        {activeTab === "kegiatan" && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Cari kode, kegiatan, atau PJ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d={Icons.search} />
                  </svg>
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={filterJenis}
                  onChange={(e) => setFilterJenis(e.target.value as any)}
                  className="h-9 px-3 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-700"
                >
                  <option value="ALL">Semua Jenis Anggaran</option>
                  <option value="APBN">APBN Saja</option>
                  <option value="NON-APBN">NON-APBN Saja</option>
                </select>
                <button
                  onClick={() => onNavigate("master")}
                  className="h-9 px-3 text-xs font-semibold bg-emerald-800 text-white rounded-md hover:bg-emerald-900 transition whitespace-nowrap cursor-pointer"
                >
                  + Tambah Kegiatan
                </button>
              </div>
            </div>

            <div className="overflow-x-auto w-full border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Kode & Kegiatan</th>
                    <th className="py-2.5 px-3">PJ Kegiatan</th>
                    <th className="py-2.5 px-3">Jenis</th>
                    <th className="py-2.5 px-3 text-right">Pagu</th>
                    <th className="py-2.5 px-3 text-right">Realisasi</th>
                    <th className="py-2.5 px-3">Serapan</th>
                    <th className="py-2.5 px-3 text-center">
                      Status Pelaporan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filtered.map((item, idx) => {
                    const pct =
                      item.pagu > 0 ? (item.realisasi / item.pagu) * 100 : 0;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 transition"
                      >
                        <td className="py-2.5 px-3 text-slate-400 font-semibold">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 max-w-[240px]">
                          <span className="text-[11px] font-semibold text-emerald-800 font-mono block">
                            {item.kode}
                          </span>
                          <span className="font-medium text-slate-900 line-clamp-1">
                            {item.nama}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                          {item.pj || "Budi Santoso"}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            text={item.jenis}
                            color={item.jenis === "APBN" ? "blue" : "gold"}
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium whitespace-nowrap">
                          {fmtRupiah(item.pagu)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-800 whitespace-nowrap">
                          {fmtRupiah(item.realisasi)}
                        </td>
                        <td className="py-2.5 px-3 min-w-[130px]">
                          <ProgressBar value={pct} color="#236437" />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge
                            text={
                              item.sudahLapor ? "Sudah Lapor" : "Belum Lapor"
                            }
                            color={item.sudahLapor ? "green" : "red"}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
