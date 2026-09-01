import React, { useState } from "react";
import { allKegiatan } from "@/data/mockData";
import { Activity } from "@/types";
import { fmtRupiah, Icons } from "@/utils/formatters";
import { generateSmartReportExcel, SmartReportItem } from "@/utils/excelExport";

export function InputLaporanPage() {
  const [tab, setTab] = useState<"form" | "excel">("form");
  const [selectedKegiatanKode, setSelectedKegiatanKode] = useState(allKegiatan[0].kode);
  const [isDragging, setIsDragging] = useState(false);
  const [fileDropped, setFileDropped] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");

  // Sesi Login User PJ Kegiatan (Otomatis)
  const sessionUser = {
    nama: "Budi Santoso",
    nip: "19820514 200801 1 008",
    email: "budi.santoso@pertanian.go.id",
    jabatan: "Penanggung Jawab (PJ) Kegiatan",
    satker: "BRMP SDLAHAN — Kementerian Pertanian RI",
  };

  // Local state for all activities to allow editing and live table preview
  const [activities, setActivities] = useState<Activity[]>(allKegiatan);

  // Current selected activity
  const activeKegiatan =
    activities.find((k) => k.kode === selectedKegiatanKode) || activities[0];

  // Direct Form State
  const [periode, setPeriode] = useState("Agustus 2026");
  const [statusAnggaran, setStatusAnggaran] = useState<"Dibuka" | "Diblokir">(
    activeKegiatan.statusAnggaran || "Dibuka"
  );
  const [uraian, setUraian] = useState(
    activeKegiatan.uraian ||
      "Telah dilaksanakan pengadaan dan kalibrasi unit spektrofotometer UV-Vis serta instalasi sensor tanah otomatis."
  );
  const [fisik, setFisik] = useState(String(activeKegiatan.fisik || 82.0));
  const [pagu, setPagu] = useState(activeKegiatan.pagu);
  const [realLalu, setRealLalu] = useState(activeKegiatan.realLalu || 529200000);
  const [realIni, setRealIni] = useState(String(activeKegiatan.realIni || 450800000));

  // Handle Kegiatan Selection Change
  const handleKegiatanSelect = (kode: string) => {
    setSelectedKegiatanKode(kode);
    const target = activities.find((k) => k.kode === kode);
    if (target) {
      setStatusAnggaran(target.statusAnggaran || "Dibuka");
      setUraian(target.uraian || "");
      setFisik(String(target.fisik || 75.0));
      setPagu(target.pagu);
      setRealLalu(target.realLalu || Math.round(target.realisasi * 0.55));
      setRealIni(String(target.realIni || Math.round(target.realisasi * 0.45)));
    }
  };

  // Calculations (Read-only / Auto calculated fields)
  const paguNum = pagu || 0;
  const laluNum = realLalu || 0;
  const iniNum = Number(realIni) || 0;
  const sdPeriode = laluNum + iniNum;
  const sisa = paguNum - sdPeriode;
  const pctSd = paguNum > 0 ? ((sdPeriode / paguNum) * 100).toFixed(1) : "0.0";

  // Handle Save (Form Manual) - Otomatis mengikat PJ dari session dan jenis_kegiatan dari master data
  const handleSave = () => {
    setActivities((prev) =>
      prev.map((item) =>
        item.kode === selectedKegiatanKode
          ? {
              ...item,
              pj: sessionUser.nama, // Aturan Otomatisasi PJ: Tercatat dari sesi login
              email: sessionUser.email,
              statusAnggaran,
              uraian,
              fisik: Number(fisik) || 0,
              realLalu: laluNum,
              realIni: iniNum,
              realisasi: sdPeriode,
              sudahLapor: true,
            }
          : item
      )
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  // Handle Excel Upload - Otomatis mencatat identitas pengunggah sebagai PJ
  const handleSaveExcelUpload = () => {
    setActivities((prev) =>
      prev.map((item) =>
        item.kode === selectedKegiatanKode
          ? {
              ...item,
              pj: sessionUser.nama, // Sistem backend otomatis mencatat identitas pengunggah
              email: sessionUser.email,
              statusAnggaran,
              uraian,
              fisik: Number(fisik) || 82.0,
              realLalu: laluNum,
              realIni: iniNum,
              realisasi: sdPeriode,
              sudahLapor: true,
            }
          : item
      )
    );
    setUploadSuccessMsg(
      `File Excel SMART berhasil diunggah! Sistem otomatis mencatat ${sessionUser.nama} (${sessionUser.email}) sebagai Penanggung Jawab Resmi.`
    );
    setTimeout(() => setUploadSuccessMsg(""), 5000);
    setFileDropped(false);
  };

  // Handle Excel Template Download
  const handleDownloadTemplate = () => {
    const reportItems: SmartReportItem[] = activities.map((item, idx) => ({
      no: idx + 1,
      kode: item.kode,
      nama: item.nama,
      jenis: item.jenis,
      pj: item.pj || sessionUser.nama,
      uraian: item.uraian || "Realisasi fisik terlaksana sesuai jadwal.",
      fisik: item.fisik || 75.0,
      pagu: item.pagu,
      statusAnggaran: item.statusAnggaran || "Dibuka",
      realLalu: item.realLalu || Math.round(item.realisasi * 0.55),
      realIni: item.realIni || Math.round(item.realisasi * 0.45),
    }));

    generateSmartReportExcel(
      reportItems,
      periode,
      `Template_Laporan_SMART_${periode.replace(" ", "_")}.xlsx`
    );
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
            Input &amp; Pelaporan Realisasi Anggaran SMART
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Formulir pelaporan berkala resmi Kementerian Pertanian dengan otomatisasi Penanggung Jawab (PJ)
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#E28B59] hover:bg-[#d47c4a] text-white rounded-md text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d={Icons.download} />
          </svg>
          Unduh Template Excel
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span>
              Laporan Realisasi SMART untuk <strong>{activeKegiatan.kode}</strong> berhasil disimpan &amp; disinkronkan ke tabel konsolidasi atas nama PJ: <strong>{sessionUser.nama}</strong>!
            </span>
          </div>
          <button
            onClick={() => setSaveSuccess(false)}
            className="text-emerald-800 hover:text-emerald-950 font-bold p-1 cursor-pointer"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {uploadSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span>{uploadSuccessMsg}</span>
          </div>
          <button
            onClick={() => setUploadSuccessMsg("")}
            className="text-emerald-800 hover:text-emerald-950 font-bold p-1 cursor-pointer"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Tabs Container ── */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 gap-2">
          <button
            onClick={() => setTab("form")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
              tab === "form"
                ? "border-[#E28B59] text-[#c76f3c] bg-white shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Metode 1: Form Input PJ Kegiatan
          </button>
          <button
            onClick={() => setTab("excel")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
              tab === "excel"
                ? "border-[#E28B59] text-[#c76f3c] bg-white shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Metode 2: Unggah File Excel SMART
          </button>
        </div>

        {/* ── TAB 1: FORM INPUT DIRECT ── */}
        {tab === "form" && (
          <div className="p-5 sm:p-6 space-y-6 max-w-5xl">
            {/* Section 1: Identitas Kegiatan, Status, & PJ Otomatis */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                <span className="w-1.5 h-3.5 bg-[#E28B59] rounded-xs" />
                1. Identitas Kegiatan, Status Anggaran &amp; Penanggung Jawab (PJ)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Pilih Kegiatan Yang Dilaporkan <span className="text-rose-500">*</span>
                    </label>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        activeKegiatan.jenis === "APBN"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-blue-50 text-blue-800 border-blue-200"
                      }`}
                    >
                      Sumber: {activeKegiatan.jenis} (Master)
                    </span>
                  </div>
                  <select
                    value={selectedKegiatanKode}
                    onChange={(e) => handleKegiatanSelect(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#E28B59]"
                  >
                    {activities.map((k) => (
                      <option key={k.kode} value={k.kode}>
                        [{k.jenis}] {k.kode} — {k.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Periode Pelaporan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={periode}
                    onChange={(e) => setPeriode(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#E28B59]"
                  >
                    <option>Agustus 2026</option>
                    <option>Juli 2026</option>
                    <option>Juni 2026</option>
                    <option>Mei 2026</option>
                  </select>
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Status Anggaran
                  </label>
                  <div className="flex gap-2">
                    {(["Dibuka", "Diblokir"] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusAnggaran(st)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded border transition cursor-pointer ${
                          statusAnggaran === st
                            ? st === "Dibuka"
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-rose-600 text-white border-rose-600"
                            : "bg-white text-slate-700 border-slate-300"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ATURAN OTOMATISASI PENANGGUNG JAWAB (PJ) READ-ONLY DARI SESI USER */}
                <div className="sm:col-span-12 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#143D32] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      BS
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {sessionUser.nama}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <svg
                            width={10}
                            height={10}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          Otomatis (Sesi Login)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        NIP: {sessionUser.nip} · {sessionUser.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10.5px] font-medium text-slate-500 block">
                      Penanggung Jawab (PJ)
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      Tervalidasi &amp; Terkunci Otomatis (Read-Only)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Realisasi Capaian Kegiatan */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                <span className="w-1.5 h-3.5 bg-[#E28B59] rounded-xs" />
                2. Realisasi Capaian Kegiatan
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* 1. Uraian Kegiatan Periode Ini */}
                <div className="sm:col-span-8 space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    1. Uraian Kegiatan Periode Ini <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={uraian}
                    onChange={(e) => setUraian(e.target.value)}
                    placeholder="Deskripsikan realisasi fisik, output lapangan, dan kendala/tindak lanjut..."
                    className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#E28B59]"
                  />
                </div>

                {/* 2. Realisasi Fisik (%) */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    2. Realisasi Fisik (%) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={fisik}
                      onChange={(e) => setFisik(e.target.value)}
                      className="w-full h-10 px-3 pr-8 text-sm bg-white border border-slate-300 rounded-md text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#E28B59]"
                      placeholder="Contoh: 82.5"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Capaian output fisik riil di lapangan
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Realisasi Anggaran */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                <span className="w-1.5 h-3.5 bg-[#E28B59] rounded-xs" />
                3. Rincian Keuangan &amp; Realisasi Anggaran
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Pagu (Read Only / Base) */}
                <div className="space-y-1 p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Pagu Anggaran (DIPA)
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{fmtRupiah(paguNum)}</p>
                  <p className="text-[10.5px] text-slate-400">Tercatat di DIPA resmi 2026</p>
                </div>

                {/* Realisasi Periode Lalu */}
                <div className="space-y-1 p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Realisasi Periode Lalu
                  </span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{fmtRupiah(laluNum)}</p>
                  <p className="text-[10.5px] text-slate-400">Akumulasi s.d. bulan sebelumnya</p>
                </div>

                {/* Realisasi Periode Ini (User Input) */}
                <div className="space-y-1 p-3 bg-amber-50/60 border border-amber-200 rounded-md">
                  <label className="block text-[10px] font-bold text-amber-900 uppercase">
                    3. Realisasi Periode Ini (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={realIni}
                    onChange={(e) => setRealIni(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs bg-white border border-amber-300 rounded font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E28B59]"
                    placeholder="Masukkan nominal Rp"
                  />
                  <p className="text-[10.5px] text-amber-800 font-semibold">{fmtRupiah(iniNum)}</p>
                </div>
              </div>

              {/* Auto Calculated Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* s.d. Periode */}
                <div className="p-3 bg-white border-2 border-emerald-600/30 rounded-lg shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase">
                      Realisasi s.d. Periode
                    </p>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      Auto
                    </span>
                  </div>
                  <p className="text-base font-bold text-emerald-950 mt-1">{fmtRupiah(sdPeriode)}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Periode Lalu + Periode Ini
                  </p>
                </div>

                {/* % Serapan */}
                <div className="p-3 bg-white border-2 border-emerald-600/30 rounded-lg shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase">
                      % Realisasi Anggaran
                    </p>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      Auto
                    </span>
                  </div>
                  <p className="text-base font-bold text-emerald-950 mt-1">{pctSd}%</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    s.d. Periode / Pagu
                  </p>
                </div>

                {/* Sisa Anggaran */}
                <div className="p-3 bg-white border-2 border-slate-300 rounded-lg shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-700 uppercase">
                      Sisa Anggaran
                    </p>
                    <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                      Auto
                    </span>
                  </div>
                  <p className="text-base font-bold text-slate-900 mt-1">{fmtRupiah(sisa)}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Pagu - s.d. Periode
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Setelah disimpan, data otomatis terikat dengan PJ <strong>{sessionUser.nama}</strong> dan diteruskan ke admin untuk konsolidasi &amp; rekap resmi.
              </span>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 text-xs font-bold bg-[#E28B59] hover:bg-[#d47c4a] text-white rounded-md transition cursor-pointer shadow-xs"
              >
                Simpan &amp; Kirim Laporan Realisasi
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 2: UPLOAD EXCEL ── */}
        {tab === "excel" && (
          <div className="p-5 sm:p-6 space-y-5 max-w-4xl">
            {/* User Session Info Banner */}
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-bold">
                  BS
                </span>
                <div>
                  <p className="text-xs font-bold text-emerald-950">
                    Pengunggah Aktif: {sessionUser.nama} ({sessionUser.email})
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    Sistem otomatis mengikat identitas Anda ke database sebagai Penanggung Jawab resmi saat berkas diunggah.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 border border-emerald-300">
                Otomatisasi Aktif
              </span>
            </div>

            {/* Step 1: Pilih Kegiatan */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Pilih Kegiatan Yang Dilaporkan <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedKegiatanKode}
                onChange={(e) => handleKegiatanSelect(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#E28B59]"
              >
                {activities.map((k) => (
                  <option key={k.kode} value={k.kode}>
                    {k.kode} — {k.nama} (Pagu: {fmtRupiah(k.pagu)})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Dropzone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Unggah File Laporan Excel Sesuai Template (.xlsx) <span className="text-rose-500">*</span>
              </label>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  setFileDropped(true);
                }}
                onClick={() => setFileDropped(true)}
                className={`border-2 border-dashed rounded-lg p-8 sm:p-10 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? "border-[#E28B59] bg-amber-50/50"
                    : "border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 text-[#E28B59] flex items-center justify-center">
                  <svg
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d={Icons.upload} />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {fileDropped
                      ? `Laporan_SMART_${activeKegiatan.kode}.xlsx`
                      : "Seret & lepas file Excel SMART di sini"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mendukung template tabel Excel ber-header multi-row Kementerian Pertanian
                  </p>
                </div>
                {fileDropped && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    File Terpilih &amp; Struktur Template Terverifikasi
                  </span>
                )}
              </div>
            </div>

            {/* Parsed Preview if dropped */}
            {fileDropped && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Hasil Verifikasi Data Excel
                  </h4>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Valid 100% · PJ Tercatat: {sessionUser.nama}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">
                      Total Pagu (Kol. 8)
                    </p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">
                      {fmtRupiah(activeKegiatan.pagu)}
                    </p>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">
                      Real. Lalu (Kol. 10)
                    </p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">
                      {fmtRupiah(laluNum)}
                    </p>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">
                      Real. Ini (Kol. 11)
                    </p>
                    <p className="font-bold text-emerald-800 text-sm mt-0.5">
                      {fmtRupiah(iniNum)}
                    </p>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">
                      Fisik (Kol. 7)
                    </p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{fisik}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setFileDropped(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
                  >
                    Ganti File
                  </button>
                  <button
                    onClick={handleSaveExcelUpload}
                    className="px-4 py-2 text-xs font-bold bg-[#E28B59] hover:bg-[#d47c4a] text-white rounded-md transition cursor-pointer shadow-xs"
                  >
                    Simpan &amp; Terapkan Data Excel (Catat PJ Otomatis)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
