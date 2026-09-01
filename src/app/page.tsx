"use client";

import { AdminDashboard } from "@/components/admin-dashboard";
import { CetakLaporanPage } from "@/components/CetakLaporanPage";
import { InputLaporanPage } from "@/components/InputLaporanPage";
import { LogAuditPage } from "@/components/LogAuditPage";
import { ManajemenKegiatanPage } from "@/components/ManajemenKegiatanPage";
import { MasterArsipSMARTPage } from "@/components/MasterArsipSMARTPage";
import { RepositoriPage } from "@/components/RepositoriPage";
import { Sidebar } from "@/components/Sidebar";
import { UserDashboard } from "@/components/UserDashboard";
import { allKegiatan, userActivities } from "@/data/mockData";
import { signOut, useSession } from "@/lib/auth-client";
import type { Activity } from "@/types";
import { Role, UserProfile } from "@/types";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

// ── Helper: map Better Auth user → UserProfile ──────────────────────────────
function mapSessionToProfile(user: {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
  nip?: string | null;
  jabatan?: string | null;
  unitKerja?: string | null;
}): UserProfile {
  return {
    nama: user.name,
    nip: user.nip ?? "",
    email: user.email,
    jabatan: user.jabatan ?? "",
    unitKerja:
      user.unitKerja ??
      "Balai Besar Perakitan dan Modernisasi Sumber Daya Lahan Pertanian",
    foto: user.image ?? "",
    role: (user.role?.toLowerCase() === "admin" ? "admin" : "user") as Role,
  };
}

// // ── Loading Screen ─────────────────────────────────────────────────────────
// function LoadingScreen({ message = "Memuat Sistem SMART..." }: { message?: string }) {
//   return (
//     <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 font-sans">
//       <div className="flex items-center gap-2 text-xs font-semibold">
//         <svg className="animate-spin h-4 w-4 text-emerald-800" viewBox="0 0 24 24" fill="none">
//           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//         </svg>
//         {message}
//       </div>
//     </div>
//   );
// }

export default function Home() {
  const { data: session, isPending } = useSession();

  const [activeMenu, setActiveMenu] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activities, setActivities] = useState<Activity[]>(allKegiatan);

  // Derive role from session
  const role: Role =
    (session?.user?.role as string)?.toLowerCase() === "admin"
      ? "admin"
      : "user";

  // Set default menu per role when session changes
  useEffect(() => {
    if (session?.user) {
      const defaultMenu = role === "admin" ? "exec" : "dashboard";
      setActiveMenu((prev) => prev || defaultMenu);
    }
  }, [session?.user, role]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await signOut();
    setActiveMenu("");
  };

  const handleMenuChange = (menu: string) => {
    // Enforce role-based menu access
    if (role === "user") {
      const allowedUserMenus = ["dashboard", "input"];
      if (!allowedUserMenus.includes(menu)) return;
    }
    setActiveMenu(menu);
  };

  // ── Render Guards ─────────────────────────────────────────────────────────
  if (isPending) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Memuat sesi...
      </div>
    );
  }

  if (!session) {
    redirect("/login");
    return null; // safety, redirect() throws internally di Next.js
  }

  // if (!userProfile) {
  //   return <LoadingScreen message="Menyiapkan profil pengguna..." />;
  // }

  const currentMenu = activeMenu || (role === "admin" ? "exec" : "dashboard");

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased">
      <Sidebar
        role={role}
        activeMenu={currentMenu}
        onMenuChange={handleMenuChange}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* <TopHeader
          role={role}
          activeMenu={currentMenu}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNavigate={handleMenuChange}
          onLogout={handleLogout}
          userProfile={userProfile}
          onUpdateProfile={handleProfileUpdate}
        /> */}

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 max-w-350 w-full mx-auto">
          {role === "user" && (
            <>
              {currentMenu === "dashboard" && (
                <UserDashboard
                  activities={userActivities}
                  onNavigate={handleMenuChange}
                />
              )}
              {currentMenu === "input" && <InputLaporanPage />}
            </>
          )}

          {role === "admin" && (
            <>
              {currentMenu === "exec" && (
                <AdminDashboard
                  activities={activities}
                  onNavigate={handleMenuChange}
                />
              )}
              {currentMenu === "master" && (
                <ManajemenKegiatanPage
                  activities={activities}
                  onUpdateActivities={setActivities}
                />
              )}
              {currentMenu === "repositori" && <RepositoriPage />}
              {currentMenu === "arsip-sp2d" && (
                <MasterArsipSMARTPage
                  onNavigateToAudit={() => handleMenuChange("log-audit")}
                />
              )}
              {currentMenu === "log-audit" && <LogAuditPage />}
              {currentMenu === "cetak" && <CetakLaporanPage />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
