import React, { useState } from "react";
import { allKegiatan } from "@/data/mockData";
import { fmtRupiah, Icons } from "@/utils/formatters";
import kemEntanLogo from "@/imports/Kementerian_Pertanian_Kementan_Logo.svg";
import { generateSmartReportExcel, SmartReportItem } from "@/utils/excelExport";

export function CetakLaporanPage() {
  const [periode, setPeriode] = useState("Agustus 2026");
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [useDualTtd, setUseDualTtd] = useState(false); // Default false = 1 TTD (Kiri Bawah)
  const [extraSpace, setExtraSpace] = useState(true);

  // Penanggung Jawab Kegiatan (Kiri - Default & Always Active)
  const [labelPj, setLabelPj] = useState(
    "Penanggung Jawab Kegiatan / Pembuat Laporan,"
  );
  const [namaPj, setNamaPj] = useState("Budi Santoso");
  const [nipPj, setNipPj] = useState("19820514 200801 1 008");
  const [jabatanPj, setJabatanPj] = useState("Penanggung Jawab (PJ) Kegiatan");

  // Kepala Balai / Verifikator (Kanan - Active only when Dual TTD is checked)
  const [labelAtasan, setLabelAtasan] = useState(
    "Mengetahui,\nKepala Balai Besar Perakitan dan Modernisasi SD Lahan Pertanian"
  );
  const [namaAtasan, setNamaAtasan] = useState("Dr. Ir. Ahmad Rachman, M.Si.");
  const [nipAtasan, setNipAtasan] = useState("19650412 199103 1 005");
  const [jabatanAtasan, setJabatanAtasan] = useState("Kepala Balai Besar");

  // Process activity data for 14 columns
  const reportRows = allKegiatan.map((row, idx) => {
    const pagu = row.pagu;
    const realLalu =
      row.realLalu !== undefined
        ? row.realLalu
        : Math.round((row.realisasi || 0) * 0.55);
    const realIni =
      row.realIni !== undefined
        ? row.realIni
        : Math.round((row.realisasi || 0) * 0.45);
    const sdPeriode = realLalu + realIni;
    const pctSerapan = pagu > 0 ? (sdPeriode / pagu) * 100 : 0;
    const sisa = pagu - sdPeriode;
    const statusAnggaran = row.statusAnggaran || "Dibuka";
    const fisik = row.fisik !== undefined ? row.fisik : 75.0;
    const uraian =
      row.uraian ||
      "Realisasi fisik dan output kegiatan tercapai sesuai target TOR/RAB.";
    const pj = row.pj || "Budi Santoso";

    return {
      no: idx + 1,
      kode: row.kode,
      nama: row.nama,
      jenis: row.jenis,
      pj,
      uraian,
      fisik,
      pagu,
      statusAnggaran,
      realLalu,
      realIni,
      sdPeriode,
      pctSerapan,
      sisa,
    };
  });

  const totalPagu = reportRows.reduce((a, b) => a + b.pagu, 0);
  const totalRealLalu = reportRows.reduce((a, b) => a + b.realLalu, 0);
  const totalRealIni = reportRows.reduce((a, b) => a + b.realIni, 0);
  const totalSd = reportRows.reduce((a, b) => a + b.sdPeriode, 0);
  const totalSisa = reportRows.reduce((a, b) => a + b.sisa, 0);
  const avgPct = totalPagu > 0 ? (totalSd / totalPagu) * 100 : 0;
  const avgFisik =
    reportRows.length > 0
      ? reportRows.reduce((a, b) => a + b.fisik, 0) / reportRows.length
      : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const items: SmartReportItem[] = reportRows.map((r) => ({
      no: r.no,
      kode: r.kode,
      nama: r.nama,
      jenis: r.jenis,
      pj: r.pj,
      uraian: r.uraian,
      fisik: r.fisik,
      pagu: r.pagu,
      statusAnggaran: r.statusAnggaran,
      realLalu: r.realLalu,
      realIni: r.realIni,
      realSd: r.sdPeriode,
      pct: r.pctSerapan,
      sisa: r.sisa,
    }));

    const cleanPeriode = periode.toLowerCase().replace(/[^a-z0-9]/g, "");
    const fileName = `laporan_${cleanPeriode}.xlsx`;

    generateSmartReportExcel(
      items,
      periode,
      fileName
    );
  };

  return (
    <div className="space-y-4 w-full">
      {/* ════════════════════════════════════════════════════════════════════════
          BAGIAN ATAS (1): ACTION BAR & KONTROL CEPAT (Print Hidden)
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-xs p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span>Periode:</span>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="h-8 px-2.5 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#E28B59]"
            >
              <option>Agustus 2026</option>
              <option>Juli 2026</option>
              <option>Juni 2026</option>
              <option>Semester I 2026</option>
            </select>
          </div>

          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900">
            Format: Dokumen Cetak A4 Landscape
          </span>

          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
            Mode TTD: {useDualTtd ? "Dual TTD (2 Kolom)" : "Default (1 TTD Kiri Bawah)"}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition cursor-pointer border border-slate-200"
          >
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d={Icons.settings} />
            </svg>
            {isSettingsOpen ? "Tutup Pengaturan" : "Buka Pengaturan Cetak"}
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E28B59] hover:bg-[#d47c4a] text-white rounded-md text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d={Icons.excel} />
            </svg>
            Ekspor Excel
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d={Icons.print} />
            </svg>
            Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          BAGIAN ATAS (2): COLLAPSIBLE PANEL PENGATURAN CETAK (Full Width w-full)
      ════════════════════════════════════════════════════════════════════════ */}
      {isSettingsOpen && (
        <div className="w-full bg-white rounded-lg border border-slate-200/90 shadow-xs overflow-hidden print:hidden text-xs">
          {/* Panel Header */}
          <div className="bg-[#E28B59] text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <h3 className="font-bold text-xs tracking-tight">
                Panel Pengaturan Cetak &amp; Penandatanganan Dokumen
              </h3>
            </div>
            <span className="text-[11px] text-amber-100">
              Konfigurasi Tanda Tangan &amp; Opsi Lembar A4 Landscape
            </span>
          </div>

          <div className="p-4 space-y-4">
            {/* Opsi Mode Tanda Tangan & Ruang Cap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/60 p-3 rounded-lg border border-amber-200/80">
              <label className="flex items-start gap-2.5 text-xs font-bold text-amber-950 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useDualTtd}
                  onChange={(e) => setUseDualTtd(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-amber-400 text-[#E28B59] focus:ring-[#E28B59]"
                />
                <div>
                  <span>Gunakan Dual TTD (2 Kolom Tanda Tangan)</span>
                  <p className="font-normal text-[11px] text-amber-800/90 mt-0.5">
                    {useDualTtd
                      ? "Aktif: Menampilkan 2 kolom (Kiri: PJ Kegiatan, Kanan: Kepala Balai/Verifikator)."
                      : "Nonaktif (Default): Hanya 1 kolom TTD di KIRI BAWAH (Penanggung Jawab Kegiatan). Kolom kanan disembunyikan."}
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 text-xs font-bold text-amber-950 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={extraSpace}
                  onChange={(e) => setExtraSpace(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-amber-400 text-[#E28B59] focus:ring-[#E28B59]"
                />
                <div>
                  <span>Sediakan Ruang Luas untuk TTD &amp; Cap Basah (64px)</span>
                  <p className="font-normal text-[11px] text-amber-800/90 mt-0.5">
                    Memberikan ruang vertikal ekstra untuk pembubuhan stempel dan tanda tangan fisik.
                  </p>
                </div>
              </label>
            </div>

            {/* Form Fields: Penanggung Jawab (Kiri) & Atasan (Kanan) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Kolom Kiri: Penanggung Jawab Kegiatan (Default / Always Shown) */}
              <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-[#E28B59] rounded-xs" />
                    KOLOM KIRI — PENANGGUNG JAWAB KEGIATAN
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Wajib / Utama
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Label Jabatan Pembuat Laporan
                  </label>
                  <input
                    type="text"
                    value={labelPj}
                    onChange={(e) => setLabelPj(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#E28B59]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nama Lengkap &amp; Gelar PJ
                    </label>
                    <input
                      type="text"
                      value={namaPj}
                      onChange={(e) => setNamaPj(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#E28B59]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      NIP Penanggung Jawab
                    </label>
                    <input
                      type="text"
                      value={nipPj}
                      onChange={(e) => setNipPj(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-[#E28B59]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Jabatan Struktural / Tim
                  </label>
                  <input
                    type="text"
                    value={jabatanPj}
                    onChange={(e) => setJabatanPj(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#E28B59]"
                  />
                </div>
              </div>

              {/* Kolom Kanan: Kepala Balai / Verifikator (Only when Dual TTD active) */}
              <div
                className={`p-3.5 rounded-lg space-y-2.5 transition ${
                  useDualTtd
                    ? "bg-slate-50/80 border border-slate-200 opacity-100"
                    : "bg-slate-100/50 border border-slate-200/60 opacity-60 pointer-events-none"
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-slate-400 rounded-xs" />
                    KOLOM KANAN — KEPALA BALAI / VERIFIKATOR
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      useDualTtd
                        ? "text-blue-800 bg-blue-100"
                        : "text-slate-500 bg-slate-200"
                    }`}
                  >
                    {useDualTtd ? "Dual TTD Aktif" : "Disembunyikan (Default)"}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Label Jabatan Atasan / Verifikator
                  </label>
                  <textarea
                    rows={1}
                    value={labelAtasan}
                    onChange={(e) => setLabelAtasan(e.target.value)}
                    disabled={!useDualTtd}
                    className="w-full p-2 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#E28B59] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nama Lengkap &amp; Gelar
                    </label>
                    <input
                      type="text"
                      value={namaAtasan}
                      onChange={(e) => setNamaAtasan(e.target.value)}
                      disabled={!useDualTtd}
                      className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#E28B59]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      NIP Atasan / Verifikator
                    </label>
                    <input
                      type="text"
                      value={nipAtasan}
                      onChange={(e) => setNipAtasan(e.target.value)}
                      disabled={!useDualTtd}
                      className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-[#E28B59]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Jabatan Struktural
                  </label>
                  <input
                    type="text"
                    value={jabatanAtasan}
                    onChange={(e) => setJabatanAtasan(e.target.value)}
                    disabled={!useDualTtd}
                    className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#E28B59]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          BAGIAN BAWAH: PRATINJAU KERTAS A4 LANDSCAPE (Full Width Container)
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="w-full overflow-x-auto flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-200/70 rounded-xl shadow-inner min-h-[640px]">
        {/* Banner Label Header Pratinjau (Print Hidden) */}
        <div className="w-full max-w-[1060px] flex items-center justify-between text-slate-700 text-[11px] font-medium mb-3 px-1 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span className="font-bold text-slate-900 uppercase tracking-wide">
              PRATINJAU DOKUMEN LAPORAN (A4 LANDSCAPE)
            </span>
          </div>
          <span className="text-[10.5px] text-slate-600 bg-white/80 px-2.5 py-0.5 rounded border border-slate-300 shadow-2xs font-semibold">
            {useDualTtd
              ? "Format Dual Tanda Tangan (2 Kolom)"
              : "Format Standar (1 Tanda Tangan Kiri Bawah)"}
          </span>
        </div>

        {/* ── Lembar Dokumen Kertas A4 Landscape (1060px) ── */}
        <div
          id="printable-paper"
          className="bg-white text-black p-6 sm:p-8 shadow-xl print:shadow-none border border-slate-300 print:border-none w-[1060px] max-w-[1060px] text-[9px] leading-tight"
          style={{
            fontFamily: "'Times New Roman', Times, Georgia, serif",
          }}
        >
          {/* ── Kop Surat Resmi Kementerian Pertanian ── */}
          <div className="flex items-center gap-4 pb-2">
            <img
              src={kemEntanLogo}
              alt="Logo Kementan"
              className="h-16 w-auto object-contain flex-shrink-0"
            />
            <div className="text-center flex-1">
              <p className="text-[12px] font-bold uppercase tracking-wide">
                KEMENTERIAN PERTANIAN REPUBLIK INDONESIA
              </p>
              <p className="text-[12px] font-bold uppercase tracking-wide">
                BADAN STANDARDISASI INSTRUMEN PERTANIAN
              </p>
              <p className="text-[13px] font-bold uppercase tracking-wide text-[#8a441e]">
                BALAI BESAR PERAKITAN DAN MODERNISASI SUMBER DAYA LAHAN PERTANIAN
              </p>
              <p className="text-[9px] text-slate-700 mt-0.5">
                Jl. Tentara Pelajar No. 12, Cimanggu, Kota Bogor 16111 | Telp: (0251) 8321762 | Email: brmp.sdlahan@pertanian.go.id
              </p>
            </div>
          </div>

          {/* Double Line Garis Kop Surat */}
          <div className="w-full border-b-[2.5px] border-black mt-1" />
          <div className="w-full border-b-[1px] border-black mt-[1.5px] mb-3" />

          {/* ── Judul Laporan ── */}
          <div className="text-center mb-3">
            <h1 className="text-[12px] font-bold uppercase tracking-wider underline">
              LAPORAN REALISASI CAPAIAN DAN ANGGARAN KEGIATAN (SMART)
            </h1>
            <h2 className="text-[11px] font-bold uppercase tracking-wider mt-0.5">
              TAHUN ANGGARAN 2026
            </h2>
          </div>

          {/* ── Meta Laporan ── */}
          <div className="text-[9.5px] space-y-0.5 mb-2.5">
            <div className="flex">
              <span className="w-32 text-slate-700 font-medium">Periode Pelaporan</span>
              <span className="font-semibold text-slate-900">: {periode}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-700 font-medium">Satuan Kerja</span>
              <span className="font-semibold text-slate-900">
                : Balai Besar Perakitan dan Modernisasi Sumber Daya Lahan Pertanian (BRMP SDLAHAN)
              </span>
            </div>
          </div>

          {/* ── Tabel Laporan Resmi dengan Multi-Row Header & Persentase Lebar Presisi ── */}
          <table className="w-full table-fixed border-collapse border border-black text-[8.5px] leading-tight">
            <colgroup><col style={{ width: "3%" }} /><col style={{ width: "9%" }} /><col style={{ width: "17%" }} /><col style={{ width: "4.5%" }} /><col style={{ width: "16%" }} /><col style={{ width: "4.5%" }} /><col style={{ width: "8.5%" }} /><col style={{ width: "5%" }} /><col style={{ width: "7.5%" }} /><col style={{ width: "7.5%" }} /><col style={{ width: "7.5%" }} /><col style={{ width: "3.5%" }} /><col style={{ width: "6.5%" }} /></colgroup>

            <thead>
              {/* Header Row 1 (Cetak Tanpa Kolom PJ) */}
              <tr className="bg-[#E28B59] print:bg-[#E28B59] text-white print:text-black font-bold text-center border-b border-black">
                <th rowSpan={2} className="border border-black py-1 px-0.5 text-center align-middle font-bold">
                  No
                </th>
                <th rowSpan={2} className="border border-black py-1 px-1 text-center align-middle font-bold">
                  Kode
                </th>
                <th rowSpan={2} className="border border-black py-1 px-1.5 text-center align-middle font-bold">
                  Kegiatan
                </th>
                <th rowSpan={2} className="border border-black py-1 px-0.5 text-center align-middle font-bold">
                  Jenis Kegiatan
                </th>
                <th colSpan={2} className="border border-black py-1 px-1 text-center align-middle font-bold">
                  Realisasi Capaian Kegiatan
                </th>
                <th rowSpan={2} className="border border-black py-1 px-1 text-center align-middle font-bold">
                  Pagu Anggaran
                </th>
                <th rowSpan={2} className="border border-black py-1 px-0.5 text-center align-middle font-bold">
                  Status Anggaran
                </th>
                <th colSpan={4} className="border border-black py-1 px-1 text-center align-middle font-bold">
                  Realisasi Anggaran
                </th>
                <th rowSpan={2} className="border border-black py-1 px-1 text-center align-middle font-bold">
                  Sisa Anggaran
                </th>
              </tr>

              {/* Header Row 2 (Sub-Header) */}
              <tr className="bg-[#D97D4B] print:bg-[#D97D4B] text-white print:text-black font-bold text-center border-b border-black text-[8px]">
                {/* Under Realisasi Capaian Kegiatan */}
                <th className="border border-black py-1 px-1 text-center align-middle font-bold">
                  Uraian Kegiatan Periode Ini
                </th>
                <th className="border border-black py-1 px-0.5 text-center align-middle font-bold">
                  Realisasi Fisik (%)
                </th>

                {/* Under Realisasi Anggaran */}
                <th className="border border-black py-1 px-1 text-center align-middle font-bold">
                  Periode Lalu
                </th>
                <th className="border border-black py-1 px-1 text-center align-middle font-bold">
                  Periode Ini
                </th>
                <th className="border border-black py-1 px-1 text-center align-middle font-bold">
                  s.d. Periode
                </th>
                <th className="border border-black py-1 px-0.5 text-center align-middle font-bold">
                  %
                </th>
              </tr>
            </thead>

            <tbody>
              {reportRows.map((row) => (
                <tr key={row.no} className="border-b border-black">
                  <td className="border border-black py-1 px-0.5 text-center font-semibold">
                    {row.no}
                  </td>
                  <td className="border border-black py-1 px-1 font-mono text-[8px] font-bold break-all">
                    {row.kode}
                  </td>
                  <td className="border border-black py-1 px-1.5 text-left font-medium break-words">
                    {row.nama}
                  </td>
                  <td className="border border-black py-1 px-0.5 text-center text-[8px]">
                    {row.jenis}
                  </td>
                  <td className="border border-black py-1 px-1 text-left leading-snug text-[8px] break-words">
                    {row.uraian}
                  </td>
                  <td className="border border-black py-1 px-0.5 text-center font-bold">
                    {row.fisik.toFixed(1)}%
                  </td>
                  <td className="border border-black py-1 px-1 text-right whitespace-nowrap">
                    {fmtRupiah(row.pagu)}
                  </td>
                  <td className="border border-black py-1 px-0.5 text-center font-semibold text-[8px]">
                    <span
                      className={
                        row.statusAnggaran === "Dibuka"
                          ? "text-emerald-900 font-bold"
                          : "text-rose-900 font-bold"
                      }
                    >
                      {row.statusAnggaran}
                    </span>
                  </td>
                  <td className="border border-black py-1 px-1 text-right whitespace-nowrap">
                    {fmtRupiah(row.realLalu)}
                  </td>
                  <td className="border border-black py-1 px-1 text-right font-bold whitespace-nowrap">
                    {fmtRupiah(row.realIni)}
                  </td>
                  <td className="border border-black py-1 px-1 text-right font-bold whitespace-nowrap">
                    {fmtRupiah(row.sdPeriode)}
                  </td>
                  <td className="border border-black py-1 px-0.5 text-center font-bold">
                    {row.pctSerapan.toFixed(1)}%
                  </td>
                  <td className="border border-black py-1 px-1 text-right whitespace-nowrap">
                    {fmtRupiah(row.sisa)}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Total Summary Footer Row */}
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-black text-[8.5px]">
                <td colSpan={4} className="border border-black py-1 px-1 text-center uppercase tracking-wide">
                  TOTAL KESELURUHAN
                </td>
                <td className="border border-black py-1 px-1 text-left text-[7.5px] font-normal">
                  {reportRows.length} Kegiatan Terdaftar
                </td>
                <td className="border border-black py-1 px-0.5 text-center font-bold">
                  {avgFisik.toFixed(1)}%
                </td>
                <td className="border border-black py-1 px-1 text-right whitespace-nowrap">
                  {fmtRupiah(totalPagu)}
                </td>
                <td className="border border-black py-1 px-0.5 text-center">
                  —
                </td>
                <td className="border border-black py-1 px-1 text-right whitespace-nowrap">
                  {fmtRupiah(totalRealLalu)}
                </td>
                <td className="border border-black py-1 px-1 text-right whitespace-nowrap">
                  {fmtRupiah(totalRealIni)}
                </td>
                <td className="border border-black py-1 px-1 text-right whitespace-nowrap font-extrabold">
                  {fmtRupiah(totalSd)}
                </td>
                <td className="border border-black py-1 px-0.5 text-center font-extrabold">
                  {avgPct.toFixed(1)}%
                </td>
                <td className="border border-black py-1 px-1 text-right whitespace-nowrap font-bold">
                  {fmtRupiah(totalSisa)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* ── Area Tanda Tangan Resmi (Posisi Kiri Bawah vs Dual TTD Horizontal) ── */}
          {useDualTtd ? (
            /* DUAL TTD: 2 Kolom Sejajar Horizontal (Simetris & Berjarak Proporsional dari Pinggir Kertas) */
            <div
              className="signature-container break-inside-avoid page-break-inside-avoid print:break-inside-avoid flex justify-between items-start px-12 sm:px-14 pt-6 pb-2 text-[10px]"
              style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
            >
              {/* Kolom Kiri: Penanggung Jawab Kegiatan */}
              <div
                className="flex flex-col items-center justify-center text-center w-72 break-inside-avoid page-break-inside-avoid print:break-inside-avoid"
                style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
              >
                <div className="whitespace-pre-line leading-snug text-center">{labelPj}</div>
                <div className={extraSpace ? "h-16" : "h-12"} />
                <p className="font-bold underline text-[10.5px] text-center">{namaPj}</p>
                <p className="text-[9.5px] text-center">NIP. {nipPj}</p>
                {jabatanPj && <p className="text-[9px] text-slate-600 mt-0.5 text-center">{jabatanPj}</p>}
              </div>

              {/* Kolom Kanan: Kepala Balai / Verifikator */}
              <div
                className="flex flex-col items-center justify-center text-center w-72 break-inside-avoid page-break-inside-avoid print:break-inside-avoid"
                style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
              >
                <div className="whitespace-pre-line leading-snug text-center">{labelAtasan}</div>
                <div className={extraSpace ? "h-16" : "h-12"} />
                <p className="font-bold underline text-[10.5px] text-center">{namaAtasan}</p>
                <p className="text-[9.5px] text-center">NIP. {nipAtasan}</p>
                {jabatanAtasan && <p className="text-[9px] text-slate-600 mt-0.5 text-center">{jabatanAtasan}</p>}
              </div>
            </div>
          ) : (
            /* DEFAULT STATE: 1 Kolom TTD di SEBELAH KIRI BAWAH (Bergeser ke tengah, tidak mepet pinggir kertas) */
            <div
              className="signature-container break-inside-avoid page-break-inside-avoid print:break-inside-avoid flex justify-start pt-6 pb-2 pl-14 sm:pl-16 text-[10px]"
              style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
            >
              <div
                className="flex flex-col items-center justify-center text-center w-72 break-inside-avoid page-break-inside-avoid print:break-inside-avoid"
                style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
              >
                <div className="whitespace-pre-line leading-snug text-center">{labelPj}</div>
                <div className={extraSpace ? "h-16" : "h-12"} />
                <p className="font-bold underline text-[10.5px] text-center">{namaPj}</p>
                <p className="text-[9.5px] text-center">NIP. {nipPj}</p>
                {jabatanPj && <p className="text-[9px] text-slate-600 mt-0.5 text-center">{jabatanPj}</p>}
              </div>
            </div>
          )}

          {/* ── Footer Dokumen Resmi ── */}
          <div className="border-t border-slate-400 pt-1.5 mt-4 flex items-center justify-between text-[8.5px] text-slate-600">
            <span>
              Sistem Informasi SMART — BRMP Sumber Daya Lahan Pertanian — Kementerian Pertanian RI
            </span>
            <span className="print-page-number">
              Dokumen Resmi Laporan SMART — BRMP SDLAHAN Kementan RI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
