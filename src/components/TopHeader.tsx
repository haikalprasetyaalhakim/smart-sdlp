import React, { useState, useRef, useEffect } from "react";
import { Role, UserProfile } from "@/types";
import { Icons } from "@/utils/formatters";
import {
  User,
  LogOut,
  ChevronDown,
  CheckCircle,
  Briefcase,
  Shield,
  Mail,
} from "lucide-react";
import NotificationsWithActions, {
  NotificationItem as UiNotificationItem,
} from "@/components/ui/notifications-with-actions";
import { EditProfileModal } from "./EditProfileModal";

interface TopHeaderProps {
  role: Role;
  activeMenu: string;
  onOpenMobileMenu: () => void;
  onRoleSwitch?: (role: Role) => void;
  onNavigate?: (menu: string) => void;
  onLogout?: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

const breadcrumbMap: Record<string, string> = {
  dashboard: "Beranda Saya",
  input: "Isi Laporan",
  exec: "Ringkasan Utama",
  master: "Kelola Kegiatan",
  repositori: "Dokumen Umum",
  "arsip-sp2d": "Arsip Laporan",
  "log-audit": "Riwayat Hapus",
  cetak: "Cetak Dokumen",
};

const smartNotifications: UiNotificationItem[] = [
  {
    id: "1",
    title: "Laporan Masuk",
    description:
      "PJ Budi Santoso telah mengirimkan laporan realisasi Agustus 2026.",
    time: "10m yang lalu",
    targetMenu: "arsip-sp2d",
  },
  {
    id: "2",
    title: "Peringatan Serapan",
    description: "2 Kegiatan memilik progres fisik di bawah target 50%.",
    time: "1j yang lalu",
    targetMenu: "master",
  },
  {
    id: "3",
    title: "Verifikasi Berkas",
    description: "Dokumen SK Penugasan TA 2026 berhasil disetujui.",
    time: "Kemarin",
    targetMenu: "repositori",
  },
];

export function TopHeader({
  role,
  activeMenu,
  onOpenMobileMenu,
  onNavigate,
  onLogout,
  userProfile,
  onUpdateProfile,
}: TopHeaderProps) {
  const isAdmin = role === "admin";

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  const handleNotificationClick = (item: UiNotificationItem) => {
    if (item.targetMenu && onNavigate) {
      onNavigate(item.targetMenu);
    }
  };

  const handleSaveProfile = (updated: UserProfile) => {
    onUpdateProfile(updated);
    setToastMessage("Profil berhasil diperbarui!");
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const getInitials = (name: string) => {
    return (
      name
        .split(" ")
        .filter(
          (n) =>
            !n.startsWith("Ir.") &&
            !n.startsWith("Dr.") &&
            !n.startsWith("Drs."),
        )
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase() || name.substring(0, 2).toUpperCase()
    );
  };

  return (
    <>
      <header className="h-14 bg-[#143D32] border-b border-emerald-900/60 sticky top-0 z-30 px-3 sm:px-5 flex items-center justify-between text-white shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 -ml-1 text-emerald-200 hover:text-white hover:bg-emerald-800/60 rounded focus:outline-none cursor-pointer"
            title="Buka Menu"
          >
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={Icons.hamburger} />
            </svg>
          </button>

          <div className="min-w-0">
            <p className="text-[10px] font-medium text-emerald-300/80 truncate leading-tight">
              SMART · BRMP SDLAHAN / {breadcrumbMap[activeMenu] || "Dashboard"}
            </p>
            <h1 className="text-xs sm:text-sm font-bold text-white truncate leading-tight mt-0.5">
              {breadcrumbMap[activeMenu] ||
                "SMART — Sistem Monitoring & Tracking"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <NotificationsWithActions
            items={smartNotifications}
            placement="bottom"
            onItemClick={handleNotificationClick}
          />

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
              }}
              className="flex items-center gap-2 pl-2 border-l border-emerald-800/60 hover:bg-emerald-800/40 p-1.5 rounded-lg transition cursor-pointer focus:outline-none"
            >
              {userProfile.foto ? (
                <img
                  src={userProfile.foto}
                  alt={userProfile.nama}
                  className="w-7 h-7 rounded-full border border-emerald-400/80 object-cover shadow-xs"
                />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-emerald-800 border border-emerald-600/40 text-white text-[11px] font-bold shadow-xs">
                  {getInitials(userProfile.nama)}
                </div>
              )}

              <div className="hidden lg:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-white leading-tight truncate max-w-[120px]">
                    {userProfile.nama}
                  </span>
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                    {isAdmin ? "Super Admin" : "PJ Kegiatan"}
                  </span>
                </div>
                <p className="text-[9.5px] text-emerald-300/70 leading-tight truncate max-w-[120px]">
                  {userProfile.jabatan ||
                    (isAdmin
                      ? "Pusat Data & Sistem Informasi"
                      : "PJ Lahan Rawa")}
                </p>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-emerald-300/80 hidden sm:block ml-0.5" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-start gap-3">
                  {userProfile.foto ? (
                    <img
                      src={userProfile.foto}
                      alt={userProfile.nama}
                      className="w-11 h-11 rounded-full border-2 border-emerald-600 object-cover shadow-xs flex-shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full border-2 border-emerald-600 bg-[#143D32] text-white flex items-center justify-center text-sm font-bold shadow-xs flex-shrink-0">
                      {getInitials(userProfile.nama)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {userProfile.nama}
                    </h4>
                    <p className="text-[10.5px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      {userProfile.email}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                        {isAdmin ? "Super Admin" : "PJ Kegiatan"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white border-b border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{userProfile.jabatan}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10.5px]">
                    <Shield className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{userProfile.unitKerja}</span>
                  </div>
                </div>

                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsEditModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                  >
                    <User className="w-4 h-4 text-emerald-700" />
                    <span>Profil Saya &amp; Edit Data Diri</span>
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  {onLogout && (
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Keluar Sistem</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userProfile={userProfile}
        onSave={handleSaveProfile}
      />

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#143D32] text-white px-4 py-3 rounded-lg shadow-xl border border-emerald-600/50 flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200">
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-3.5 h-3.5" />
          </span>
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
