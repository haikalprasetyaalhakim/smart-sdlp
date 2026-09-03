import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { LogAuditPage } from "@/components/LogAuditPage";

const PAGE_SIZE = 10;

export default async function AuditLogRoute({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");
  if (session.user.role?.toLowerCase() !== "admin") redirect("/dashboard");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const q = params.q?.trim() ?? "";

  const where: Prisma.AuditLogWhereInput = {
    ...(q && {
      OR: [
        { namaFile: { contains: q, mode: "insensitive" } },
        { kodeKegiatan: { contains: q, mode: "insensitive" } },
        { namaKegiatan: { contains: q, mode: "insensitive" } },
        { pemilikNama: { contains: q, mode: "insensitive" } },
        { alasan: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const serializedLogs = logs.map((log) => ({
    id: log.id,
    waktu:
      log.createdAt.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB",
    namaFile: log.namaFile,
    kegiatan: `${log.kodeKegiatan} - ${log.namaKegiatan}`,
    pemilik: log.pemilikNama,
    emailPemilik: log.pemilikEmail,
    admin: log.adminNama,
    adminEmail: log.adminEmail,
    alasan: log.alasan,
    notif: log.notifStatus,
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (page > totalPages) {
    const next = new URLSearchParams();
    next.set("page", String(totalPages));
    if (params.q) next.set("q", params.q);
    redirect(`/admin/log-audit?${next.toString()}`);
  }

  return (
    <LogAuditPage
      logs={serializedLogs}
      pagination={{
        page,
        totalPages,
        total,
        pageSize: PAGE_SIZE,
      }}
      currentSearch={q}
    />
  );
}
