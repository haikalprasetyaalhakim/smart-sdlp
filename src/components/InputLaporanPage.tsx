"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fmtRupiah, Icons } from "@/utils/formatters";
import { submitLaporan } from "@/features/laproran/actions";

type KegiatanForInput = {
  id: string;
  kode: string;
  nama: string;
  jenis: "APBN" | "NON-APBN";
  pagu: number;
  statusAnggaran: "Dibuka" | "Diblokir";
  uraian: string;
  fisik: number;
  realLalu: number;
  realIni: number;
  realisasi: number;
};

type SessionUser = {
  id: string;
  nama: string;
  email: string;
  nip: string;
  jabatan: string;
};

interface InputLaporanPageProps {
  kegiatanList: KegiatanForInput[];
  initialSelectedKode: string;
  sessionUser: SessionUser;
  laporanHistory: {
    kegiatanId: string;
    periodeBulan: number;
    periodeTahun: number;
    realIni: number;
    fisik: number;
  }[];
}

function generatePeriodeOptions() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const namaBulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const options: { label: string; bulan: number; tahun: number }[] = [];
  for (let bulan = currentMonth; bulan >= 1; bulan--) {
    options.push({
      label: `${namaBulan[bulan - 1]} ${currentYear}`,
      bulan,
      tahun: currentYear,
    });
  }
  return options;
}

export function InputLaporanPage({
  kegiatanList,
  initialSelectedKode,
  sessionUser,
  laporanHistory,
}: InputLaporanPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [tab, setTab] = useState<"form" | "excel">("form");

  const periodeOptions = useMemo(() => generatePeriodeOptions(), []);
  const [periodeIndex, setPeriodeIndex] = useState(0);
  const periode = periodeOptions[periodeIndex];

  const [selectedKode, setSelectedKode] = useState(initialSelectedKode);
  const activeKegiatan =
    kegiatanList.find((k) => k.kode === selectedKode) ?? kegiatanList[0];

  const [uraian, setUraian] = useState(activeKegiatan.uraian);
  const [fisik, setFisik] = useState(String(activeKegiatan.fisik));

  const priorReports = useMemo(() => {
    return laporanHistory.filter((l) => {
      if (l.kegiatanId !== activeKegiatan.id) return false;
      if (l.periodeTahun !== periode.tahun)
        return l.periodeTahun < periode.tahun;
      return l.periodeBulan < periode.bulan;
    });
  }, [activeKegiatan.id, periode, laporanHistory]);

  // Total keseluruhan dari SEMUA periode sebelumnya — dihitung ulang tiap saat,
  // bukan mengandalkan 1 nilai kumulatif tersimpan yang bisa basi.
  const realLalu = useMemo(
    () => priorReports.reduce((sum, l) => sum + l.realIni, 0),
    [priorReports],
  );

  // Untuk kunci fisik saat diblokir, tetap perlu nilai TERAKHIR (bukan sum,
  // karena fisik itu persentase kumulatif per laporan, bukan nilai yang dijumlah).
  const prevFisik = useMemo(() => {
    if (priorReports.length === 0) return activeKegiatan.fisik;
    const latest = priorReports.reduce((a, b) =>
      a.periodeTahun !== b.periodeTahun
        ? a.periodeTahun > b.periodeTahun
          ? a
          : b
        : a.periodeBulan > b.periodeBulan
          ? a
          : b,
    );
    return latest.fisik;
  }, [priorReports, activeKegiatan.fisik]);

  const [realIni, setRealIni] = useState(String(activeKegiatan.realIni));

  // ── Excel tab state (UI only, belum ada logic parsing sungguhan) ──────────
  const [isDragging, setIsDragging] = useState(false);
  const [fileDropped, setFileDropped] = useState<string | null>(null);

  const handleKegiatanSelect = (kode: string) => {
    setSelectedKode(kode);
    const target = kegiatanList.find((k) => k.kode === kode);
    if (target) {
      setUraian(target.uraian);
      setFisik(String(target.fisik));
      setRealIni(String(target.realIni));
    }
  };

  const paguNum = activeKegiatan.pagu;
  const laluNum = realLalu || 0;
  const iniNum = Number(realIni) || 0;
  const sdPeriode = laluNum + iniNum;
  const sisa = paguNum - sdPeriode;
  const pctSd = paguNum > 0 ? ((sdPeriode / paguNum) * 100).toFixed(1) : "0.0";

  const handleSave = () => {
    if (!uraian.trim()) {
      toast.error("Uraian kegiatan wajib diisi.");
      return;
    }

    startTransition(async () => {
      const result = await submitLaporan({
        kegiatanId: activeKegiatan.id,
        periodeBulan: periode.bulan,
        periodeTahun: periode.tahun,
        uraian,
        fisik: Number(fisik) || 0,
        realIni: iniNum,
      });

      if (!result.success) {
        toast.error(`Gagal menyimpan laporan: ${result.error}`);
        return;
      }

      toast.success(
        `Laporan realisasi untuk "${activeKegiatan.kode}" periode ${periode.label} berhasil disimpan.`,
      );
      router.refresh();
    });
  };

  const handleFileDrop = (fileName: string) => {
    setFileDropped(fileName);
    toast.info(
      'Fitur baca otomatis file Excel belum tersedia. Silakan gunakan tab "Form Input" untuk mengisi laporan secara manual.',
    );
  };

  const isBlocked = activeKegiatan.statusAnggaran === "Diblokir";

  const maxAllowedIni = Math.max(0, paguNum - laluNum);
  const isFullyAbsorbed = paguNum > 0 && laluNum >= paguNum;
  const exceedsRemaining = iniNum > maxAllowedIni;

  // Paksa realIni ke 0 setiap kali kegiatan aktif dalam status diblokir
  useEffect(() => {
    if (isBlocked) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRealIni("0");
    }
  }, [isBlocked, activeKegiatan.id]);

  useEffect(() => {
    if (isBlocked) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRealIni("0");
      setFisik(String(prevFisik));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBlocked, activeKegiatan.id, prevFisik]);

  useEffect(() => {
    if (isBlocked || isFullyAbsorbed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRealIni("0");
    }
    if (isBlocked) {
      setFisik(String(prevFisik));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBlocked, isFullyAbsorbed, activeKegiatan.id, prevFisik]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs p-4 sm:p-5">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
          Input &amp; Pelaporan Realisasi Anggaran SMART
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Formulir pelaporan berkala resmi Kementerian Pertanian
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase">
            Pagu Kegiatan
          </p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">
            {fmtRupiah(activeKegiatan.pagu)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase">
            Realisasi Total Saat Ini
          </p>
          <p className="text-sm font-bold text-emerald-700 mt-0.5">
            {fmtRupiah(activeKegiatan.realisasi)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase">
            Sisa Anggaran Saat Ini
          </p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">
            {fmtRupiah(
              Math.max(0, activeKegiatan.pagu - activeKegiatan.realisasi),
            )}
          </p>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 -mt-2">
        Status ini tetap sama berapa pun periode pelaporan yang dipilih di
        bawah.
      </p>

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
            className={`py-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer inline-flex items-center gap-1.5 ${
              tab === "excel"
                ? "border-[#E28B59] text-[#c76f3c] bg-white shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Metode 2: Unggah File Excel SMART
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-300">
              Segera Hadir
            </span>
          </button>
        </div>

        {/* ── TAB 1: FORM ── */}
        {tab === "form" && (
          <div className="p-5 sm:p-6 space-y-6 max-w-5xl">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                <span className="w-1.5 h-3.5 bg-[#E28B59] rounded-xs" />
                1. Identitas Kegiatan, Status Anggaran &amp; Penanggung Jawab
                (PJ)
              </div>

              {isBlocked && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                  <strong>Kegiatan ini sedang diblokir oleh admin.</strong>{" "}
                  Realisasi keuangan dan progres fisik periode ini terkunci ke
                  nilai terakhir karena tidak ada pencairan dana. Anda tetap
                  bisa mengisi uraian sebagai catatan perkembangan di lapangan.
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6 space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Pilih Kegiatan Yang Dilaporkan{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedKode}
                    onChange={(e) => handleKegiatanSelect(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#E28B59]"
                  >
                    {kegiatanList.map((k) => (
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
                    value={periodeIndex}
                    onChange={(e) => setPeriodeIndex(Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#E28B59]"
                  >
                    {periodeOptions.map((p, i) => (
                      <option key={p.label} value={i}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Status Anggaran
                  </label>
                  <div
                    className={`h-9 flex items-center justify-center rounded-md border text-xs font-bold ${
                      activeKegiatan.statusAnggaran === "Dibuka"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-rose-50 text-rose-700 border-rose-300"
                    }`}
                  >
                    ● {activeKegiatan.statusAnggaran}
                  </div>
                </div>
              </div>

              <div className="sm:col-span-12 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#143D32] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {sessionUser.nama
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      {sessionUser.nama}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      NIP: {sessionUser.nip} · {sessionUser.email}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700">
                  Tervalidasi Otomatis dari Sesi Login
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                <span className="w-1.5 h-3.5 bg-[#E28B59] rounded-xs" />
                2. Realisasi Capaian Kegiatan
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-8 space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Uraian Kegiatan Periode Ini{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={uraian}
                    onChange={(e) => setUraian(e.target.value)}
                    placeholder="Deskripsikan realisasi fisik, output lapangan, dan kendala/tindak lanjut..."
                    className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#E28B59]"
                  />
                </div>
                <div className="sm:col-span-4 space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Realisasi Fisik (%){" "}
                    {!isBlocked && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={fisik}
                      onChange={(e) => setFisik(e.target.value)}
                      disabled={isBlocked}
                      className="w-full h-10 px-3 pr-8 text-sm bg-white border border-slate-300 rounded-md text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#E28B59] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                  {isBlocked && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Terkunci ke {prevFisik}% (nilai periode sebelumnya) —
                      anggaran sedang diblokir.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                <span className="w-1.5 h-3.5 bg-[#E28B59] rounded-xs" />
                3. Rincian Keuangan &amp; Realisasi Anggaran
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Pagu Anggaran (DIPA)
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {fmtRupiah(paguNum)}
                  </p>
                </div>
                <div className="space-y-1 p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Realisasi Periode Lalu
                  </span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {fmtRupiah(realLalu)}
                  </p>
                  <p className="text-[10.5px] text-slate-400">
                    Otomatis dari akumulasi laporan periode sebelumnya
                  </p>
                </div>
                <div
                  className={`space-y-1 p-3 rounded-md border ${
                    isBlocked || isFullyAbsorbed
                      ? "bg-slate-100 border-slate-200"
                      : "bg-amber-50/60 border-amber-200"
                  }`}
                >
                  <label className="block text-[10px] font-bold uppercase text-amber-900">
                    Realisasi Periode Ini (Rp){" "}
                    {!isBlocked && !isFullyAbsorbed && (
                      <span className="text-rose-500">*</span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={realIni}
                    onChange={(e) => setRealIni(e.target.value)}
                    disabled={isBlocked || isFullyAbsorbed}
                    className={`w-full h-8 px-2.5 text-xs bg-white border rounded font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E28B59] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
                      exceedsRemaining
                        ? "border-rose-400 ring-1 ring-rose-300"
                        : "border-amber-300"
                    }`}
                  />
                  <p className="text-[10.5px] text-amber-800 font-semibold mt-1">
                    {fmtRupiah(iniNum)}
                  </p>

                  {isFullyAbsorbed && !isBlocked && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Realisasi sudah mencapai 100% pagu anggaran. Tidak ada
                      sisa yang bisa diinput.
                    </p>
                  )}
                  {isBlocked && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Terkunci — anggaran sedang diblokir, tidak ada pencairan
                      dana periode ini.
                    </p>
                  )}
                  {!isBlocked && !isFullyAbsorbed && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Batas maksimal untuk periode{" "}
                      <strong>{periode.label}</strong>:{" "}
                      {fmtRupiah(maxAllowedIni)}
                    </p>
                  )}
                  {exceedsRemaining && (
                    <p className="text-[10px] text-rose-600 font-semibold mt-1">
                      Melebihi batas periode ini ({fmtRupiah(maxAllowedIni)}).
                      Kurangi nominal.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 bg-white border-2 border-emerald-600/30 rounded-lg shadow-xs">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase">
                    Realisasi s.d. Periode
                  </p>
                  <p className="text-base font-bold text-emerald-950 mt-1">
                    {fmtRupiah(sdPeriode)}
                  </p>
                </div>
                <div className="p-3 bg-white border-2 border-emerald-600/30 rounded-lg shadow-xs">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase">
                    % Realisasi Anggaran
                  </p>
                  <p className="text-base font-bold text-emerald-950 mt-1">
                    {pctSd}%
                  </p>
                </div>
                <div className="p-3 bg-white border-2 border-slate-300 rounded-lg shadow-xs">
                  <p className="text-[10px] font-bold text-slate-700 uppercase">
                    Sisa Anggaran
                  </p>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {fmtRupiah(sisa)}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Laporan akan tercatat atas nama{" "}
                <strong>{sessionUser.nama}</strong> untuk periode{" "}
                <strong>{periode.label}</strong>.
              </span>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending || exceedsRemaining}
                className="px-5 py-2 text-xs font-bold bg-[#E28B59] hover:bg-[#d47c4a] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-md transition cursor-pointer shadow-xs"
              >
                {isPending
                  ? "Menyimpan..."
                  : "Simpan & Kirim Laporan Realisasi"}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 2: EXCEL (UI ONLY, BELUM FUNGSIONAL) ── */}
        {tab === "excel" && (
          <div className="p-5 sm:p-6 space-y-5 max-w-4xl">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-amber-600 shrink-0 mt-0.5"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div>
                <p className="text-xs font-bold text-amber-900">
                  Fitur ini masih dalam pengembangan
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Pembacaan otomatis data dari file Excel belum tersedia. Untuk
                  saat ini, gunakan tab &quot;Form Input PJ Kegiatan&quot; untuk
                  mengisi laporan.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Unggah File Laporan Excel Sesuai Template (.xlsx)
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
                  const name = e.dataTransfer.files[0]?.name ?? "file.xlsx";
                  handleFileDrop(name);
                }}
                onClick={() => handleFileDrop("file.xlsx")}
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
                      ? fileDropped
                      : "Seret & lepas file Excel SMART di sini"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fitur pembacaan file belum aktif — file tidak akan diproses
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
