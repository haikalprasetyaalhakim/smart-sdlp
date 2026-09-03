import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserDashboard } from "@/components/UserDashboard";
import type { Activity } from "@/types";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const rows = await prisma.kegiatan.findMany({
    where: { pjId: session.user.id },
    include: { pj: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const activities: Activity[] = rows.map((k) => ({
    id: k.id,
    kode: k.kode,
    nama: k.nama,
    jenis: k.jenis === "NON_APBN" ? "NON-APBN" : "APBN",
    programCategory: k.programCategory ?? undefined,
    pagu: Number(k.pagu),
    realisasi: Number(k.realisasi),
    fisik: k.fisik ?? 0,
    uraian: k.uraian ?? undefined,
    statusAnggaran: k.statusAnggaran === "DIBLOKIR" ? "Diblokir" : "Dibuka",
    realLalu: k.realLalu !== null ? Number(k.realLalu) : 0,
    realIni: k.realIni !== null ? Number(k.realIni) : 0,
    pj: k.pj?.name,
    email: k.pj?.email,
    wajib: k.wajib,
    sudahLapor: k.sudahLapor,
    status: k.sudahLapor ? "done" : "pending",
  }));

  return <UserDashboard activities={activities} />;
}
