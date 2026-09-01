export type Role = "user" | "admin";

export interface Activity {
  id: number;
  kode: string;
  nama: string;
  jenis: "APBN" | "NON-APBN";
  programCategory?: "Layanan Perkantoran" | "Fasilitas Kinerja" | "Klinik Modernisasi/KMP" | "Alat & Sarana" | string;
  pagu: number;
  realisasi: number;
  fisik?: number;
  uraian?: string;
  statusAnggaran?: "Dibuka" | "Diblokir";
  realLalu?: number;
  realIni?: number;
  pj?: string;
  email?: string;
  wajib?: boolean;
  sudahLapor?: boolean;
  status?: "done" | "pending";
}

export interface ArchiveDocument {
  id: number;
  nama: string;
  kategori: "SK" | "DIPA" | "Kontrak" | "E-Surat" | "Laporan" | "Lainnya";
  tanggal: string;
  ukuran: string;
  uploader: string;
  kegiatan?: string;
}

export interface SmartArchiveItem {
  id: number;
  kode: string;
  nama: string;
  periode: string;
  jenis: "APBN" | "NON-APBN";
  uploader: string;
  email: string;
  waktu: string;
  status: "Sudah Upload" | "Belum Upload";
}

export interface AuditLogItem {
  id: number;
  waktu: string;
  namaFile: string;
  kegiatan: string;
  pemilik: string;
  emailPemilik: string;
  admin: string;
  alasan: string;
  notif: string;
}

export interface UserProfile {
  nama: string;
  nip: string;
  email: string;
  jabatan: string;
  unitKerja: string;
  foto?: string;
  role: Role;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: "verification" | "warning" | "system";
  targetMenu?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: string;
}
