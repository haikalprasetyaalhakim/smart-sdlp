import React, { useState, useRef } from "react";
import { UserProfile } from "@/types";
import { User, Upload, Trash2, X, Mail, Briefcase, Lock, Shield, CheckCircle } from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSave: (updatedProfile: UserProfile) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  userProfile,
  onSave,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState<UserProfile>({ ...userProfile });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter((n) => !n.startsWith("Ir.") && !n.startsWith("Dr.") && !n.startsWith("Drs."))
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || name.substring(0, 2).toUpperCase();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFileError("Ukuran file melebihi batas maksimum 2 MB.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      setFileError("Hanya file gambar format JPG atau PNG yang diperbolehkan.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData((prev) => ({
          ...prev,
          foto: event.target?.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, foto: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        setPasswordError("Kata sandi baru minimal 6 karakter.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError("Konfirmasi kata sandi tidak cocok.");
        return;
      }
    }

    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-[#143D32] text-white flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800/80 flex items-center justify-center border border-emerald-700">
              <User className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Profil Saya &amp; Edit Data Diri
              </h3>
              <p className="text-[11px] text-emerald-200/80 leading-tight mt-0.5">
                Perbarui identitas pejabat/penanggung jawab kegiatan SMART
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-md hover:bg-emerald-800/60 transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-700">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-shrink-0">
              {formData.foto ? (
                <img
                  src={formData.foto}
                  alt={formData.nama}
                  className="w-20 h-20 rounded-full border-2 border-emerald-600 object-cover shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-emerald-600 bg-[#143D32] text-white flex items-center justify-center text-xl font-bold shadow-sm">
                  {getInitials(formData.nama)}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-600 border-2 border-white rounded-full flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </span>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <h4 className="text-xs font-bold text-slate-800">Foto Profil</h4>
              <p className="text-[11px] text-slate-500">
                Format yang didukung: JPG, PNG. Ukuran file maksimal 2 MB.
              </p>

              {fileError && (
                <p className="text-[11px] text-rose-600 font-semibold">{fileError}</p>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold transition cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Unggah Foto Baru
                </button>
                {formData.foto && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 hover:text-rose-700 rounded-md text-xs font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Foto
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap &amp; Gelar
              </label>
              <input
                type="text"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                required
                placeholder="Contoh: Ir. Budi Santoso, M.Si."
                className="w-full h-8.5 px-3 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIP / ID Pegawai
              </label>
              <input
                type="text"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                placeholder="19820514 200604 1 002"
                className="w-full h-8.5 px-3 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono text-slate-700 text-[11.5px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Instansi Resmi
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="nama@pertanian.go.id"
                  className="w-full h-8.5 pl-8 pr-3 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium text-slate-800"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jabatan / Kedudukan
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  required
                  placeholder="Penanggung Jawab (PJ) Kegiatan"
                  className="w-full h-8.5 pl-8 pr-3 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium text-slate-800"
                />
                <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Kerja / Satuan Kerja
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.unitKerja}
                  onChange={(e) => setFormData({ ...formData, unitKerja: e.target.value })}
                  required
                  placeholder="Balai Besar Perakitan dan Modernisasi..."
                  className="w-full h-8.5 pl-8 pr-3 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium text-slate-800 truncate"
                />
                <Shield className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              Ubah Kata Sandi <span className="text-[10.5px] font-normal text-slate-400">(Opsional)</span>
            </h4>

            {passwordError && (
              <div className="mb-2 p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded text-[11px] font-semibold">
                {passwordError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full h-8 px-3 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Konfirmasi Sandi Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi"
                  className="w-full h-8 px-3 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md text-xs font-semibold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#143D32] hover:bg-[#0E2C24] text-white rounded-md text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
