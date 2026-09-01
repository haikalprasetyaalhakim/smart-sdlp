"use client";

import React, { useState, useEffect } from "react";
import { Role, UserProfile, Activity } from "@/types";
import { userActivities, allKegiatan } from "@/data/mockData";
import { Sidebar } from "@/components/Sidebar";
import { TopHeader } from "@/components/TopHeader";
import { LoginPage } from "@/components/LoginPage";
import { UserDashboard } from "@/components/UserDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { InputLaporanPage } from "@/components/InputLaporanPage";
import { RepositoriPage } from "@/components/RepositoriPage";
import { CetakLaporanPage } from "@/components/CetakLaporanPage";
import { ManajemenKegiatanPage } from "@/components/ManajemenKegiatanPage";
import { MasterArsipSMARTPage } from "@/components/MasterArsipSMARTPage";
import { LogAuditPage } from "@/components/LogAuditPage";

const initialAdminProfile: UserProfile = {
  nama: "Admin Pusdatin",
  nip: "19820514 200604 1 002",
  email: "admin.pusdatin@pertanian.go.id",
  jabatan: "Pranata Komputer Ahli Muda",
  unitKerja: "Pusat Data dan Sistem Informasi Pertanian",
  foto: "",
  role: "admin",
};

const initialUserProfile: UserProfile = {
  nama: "Ir. Budi Santoso, M.Si.",
  nip: "19780412 200312 1 001",
  email: "budi.santoso@pertanian.go.id",
  jabatan: "Penanggung Jawab (PJ) Kegiatan",
  unitKerja:
    "Balai Besar Perakitan dan Modernisasi Sumber Daya Lahan Pertanian",
  foto: "",
  role: "user",
};

const AUTH_STORAGE_KEY = "smart_auth_session";

interface StoredAuthSession {
  isLoggedIn: boolean;
  role: Role;
  userProfile: UserProfile;
  activeMenu: string;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [role, setRole] = useState<Role>("admin");
  const [activeMenu, setActiveMenu] = useState<string>("exec");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activities, setActivities] = useState<Activity[]>(allKegiatan);
  const [userProfile, setUserProfile] = useState<UserProfile>(initialAdminProfile);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed: StoredAuthSession = JSON.parse(saved);
        if (parsed.isLoggedIn) {
          setIsLoggedIn(true);
          if (parsed.role) setRole(parsed.role);
          if (parsed.activeMenu) setActiveMenu(parsed.activeMenu);
          if (parsed.userProfile) setUserProfile(parsed.userProfile);
        }
      }
    } catch {
      // ignore parse error
    }
  }, []);

  const saveSession = (
    loggedIn: boolean,
    userRole: Role,
    profile: UserProfile,
    menu: string,
  ) => {
    try {
      if (loggedIn) {
        const sessionData: StoredAuthSession = {
          isLoggedIn: true,
          role: userRole,
          userProfile: profile,
          activeMenu: menu,
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  };

  const handleRoleSwitch = (newRole: Role) => {
    const nextProfile =
      newRole === "admin" ? initialAdminProfile : initialUserProfile;
    let nextMenu = activeMenu;

    if (newRole === "admin") {
      if (["dashboard", "input", "arsip", "unduh"].includes(activeMenu)) {
        nextMenu = "exec";
      }
    } else {
      if (
        [
          "exec",
          "master",
          "repositori",
          "arsip-sp2d",
          "log-audit",
          "cetak",
        ].includes(activeMenu)
      ) {
        nextMenu = "dashboard";
      }
    }

    setRole(newRole);
    setUserProfile(nextProfile);
    setActiveMenu(nextMenu);
    saveSession(true, newRole, nextProfile, nextMenu);
  };

  const handleLogin = (userRole: Role, email?: string) => {
    const targetProfile =
      userRole === "admin"
        ? { ...initialAdminProfile }
        : { ...initialUserProfile };
    if (email) {
      targetProfile.email = email;
    }

    const targetMenu = userRole === "admin" ? "exec" : "dashboard";

    setRole(userRole);
    setUserProfile(targetProfile);
    setActiveMenu(targetMenu);
    setIsLoggedIn(true);

    saveSession(true, userRole, targetProfile, targetMenu);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    saveSession(false, "admin", initialAdminProfile, "exec");
  };

  const handleMenuChange = (newMenu: string) => {
    let target = newMenu;
    if (role === "user") {
      const allowedUserMenus = ["dashboard", "input", "arsip", "unduh"];
      if (!allowedUserMenus.includes(target)) {
        target = "dashboard";
      }
    }
    setActiveMenu(target);
    saveSession(true, role, userProfile, target);
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    saveSession(true, role, updatedProfile, activeMenu);
  };

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 font-sans">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <svg className="animate-spin h-4 w-4 text-emerald-800" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Memuat Sistem SMART...
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased">
      <Sidebar
        role={role}
        activeMenu={activeMenu}
        onMenuChange={handleMenuChange}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <TopHeader
          role={role}
          activeMenu={activeMenu}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onRoleSwitch={handleRoleSwitch}
          onNavigate={handleMenuChange}
          onLogout={handleLogout}
          userProfile={userProfile}
          onUpdateProfile={handleProfileUpdate}
        />

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 max-w-[1400px] w-full mx-auto">
          {role === "user" && (
            <>
              {activeMenu === "dashboard" && (
                <UserDashboard
                  activities={userActivities}
                  onNavigate={setActiveMenu}
                />
              )}
              {activeMenu === "input" && <InputLaporanPage />}
            </>
          )}

          {role === "admin" && (
            <>
              {activeMenu === "exec" && (
                <AdminDashboard
                  activities={activities}
                  onNavigate={setActiveMenu}
                />
              )}
              {activeMenu === "master" && (
                <ManajemenKegiatanPage
                  activities={activities}
                  onUpdateActivities={setActivities}
                />
              )}
              {activeMenu === "repositori" && <RepositoriPage />}
              {activeMenu === "arsip-sp2d" && (
                <MasterArsipSMARTPage
                  onNavigateToAudit={() => setActiveMenu("log-audit")}
                />
              )}
              {activeMenu === "log-audit" && <LogAuditPage />}
              {activeMenu === "cetak" && <CetakLaporanPage />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
