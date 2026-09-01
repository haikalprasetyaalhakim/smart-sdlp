import React from "react";
import { Role, MenuItem } from "@/types";
import { Icons } from "@/utils/formatters";
import kemEntanLogo from "@/imports/Kementerian_Pertanian_Kementan_Logo.svg";

const userMenu: MenuItem[] = [
  { id: "dashboard", label: "Beranda Saya", icon: Icons.home },
  { id: "input", label: "Isi Laporan", icon: Icons.fileEdit },
];

const adminMenu: MenuItem[] = [
  { id: "exec", label: "Ringkasan Utama", icon: Icons.dashboard },
  { id: "master", label: "Kelola Kegiatan", icon: Icons.users },
  { id: "repositori", label: "Dokumen Umum", icon: Icons.archive },
  { id: "arsip-sp2d", label: "Arsip Laporan", icon: Icons.excel },
  { id: "log-audit", label: "Riwayat Hapus", icon: Icons.trash },
  { id: "cetak", label: "Cetak Dokumen", icon: Icons.print },
];

interface SidebarProps {
  role: Role;
  activeMenu: string;
  onMenuChange: (id: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout?: () => void;
}

export function Sidebar({
  role,
  activeMenu,
  onMenuChange,
  mobileOpen,
  onCloseMobile,
  onLogout,
}: SidebarProps) {
  const isAdmin = role === "admin";
  const menu = isAdmin ? adminMenu : userMenu;
  const logoSrc = (kemEntanLogo as any)?.src || kemEntanLogo;

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between text-emerald-100 bg-[#143D32]">
      {/* Top section: Header & Logo */}
      <div>
        <div className="h-14 px-4 border-b border-emerald-900/60 flex items-center justify-between bg-[#143D32]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={logoSrc}
              alt="Logo Kementan"
              className="h-8 w-auto object-contain flex-shrink-0 brightness-110 drop-shadow-xs"
            />
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="text-sm font-black tracking-tight text-white">
                  SMART
                </span>
                <span className="text-[11px] font-bold text-emerald-300">
                  BRMP SDLAHAN
                </span>
              </div>
              <div className="text-[9.5px] text-emerald-200/80 leading-tight truncate">
                Kementerian Pertanian RI
              </div>
            </div>
          </div>
          {/* Close button for mobile drawer */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 rounded-md text-emerald-200 hover:text-white hover:bg-emerald-800 transition cursor-pointer"
            title="Tutup Menu"
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={Icons.close} />
            </svg>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-2 space-y-0.5 overflow-y-auto">
          <div className="px-2.5 py-2 text-[9.5px] font-bold text-emerald-300/60 uppercase tracking-wider">
            Menu Utama
          </div>
          {menu.map((item) => {
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onMenuChange(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs transition-all text-left cursor-pointer ${
                  isActive
                    ? "bg-emerald-900/90 text-white font-bold border-l-3 border-emerald-400 shadow-xs"
                    : "text-emerald-100/80 hover:bg-emerald-800/50 hover:text-white"
                }`}
              >
                <span
                  className={`flex-shrink-0 ${
                    isActive ? "text-emerald-300" : "text-emerald-300/70"
                  }`}
                >
                  <svg
                    width={15}
                    height={15}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={item.icon} />
                  </svg>
                </span>
                <span className="truncate text-[11.5px]">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom section: Help & System Info */}
      <div className="p-3 border-t border-emerald-900/60 bg-[#0F3128]/50 space-y-2">
        <div className="bg-[#143D32]/80 p-2.5 rounded border border-emerald-800/40 text-[10.5px]">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Pusdatin Kementan</span>
          </div>
          <p className="text-[9.5px] text-emerald-300/70 mt-0.5">
            Sistem Sinkronisasi SMART Aktif
          </p>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-950/40 hover:bg-rose-900/40 text-emerald-200 hover:text-rose-200 text-[11px] font-semibold transition cursor-pointer"
          >
            <svg
              width={13}
              height={13}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d={Icons.logout} />
            </svg>
            Keluar Sistem
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-56 flex-shrink-0 h-screen sticky top-0 border-r border-emerald-950/50 shadow-md z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer content */}
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
