"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

const createKegiatanSchema = z.object({
  kode: z.string().min(1, "Kode kegiatan wajib diisi"),
  nama: z.string().min(1, "Nama kegiatan wajib diisi"),
  jenis: z.enum(["APBN", "NON_APBN"]),
  programCategory: z.string().min(1, "Kategori program wajib dipilih"),
  pagu: z.coerce.number().int().positive("Pagu harus lebih dari 1"),
  pjId: z.string().optional(),
  uraian: z.string().optional(),
});

export type CreateKegiatanInput = z.infer<typeof createKegiatanSchema>;

type CreateKegiatanResult =
  | {
      success: true;
      kegiatan: {
        id: string;
        kode: string;
        nama: string;
        jenis: string;
        programCategory: string | null;
        pagu: number;
        realisasi: number;
        pj: { id: string; name: string; email: string } | null;
      };
    }
  | { success: false; error: string };

export async function createKegiatan(
  input: CreateKegiatanInput,
): Promise<CreateKegiatanResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { success: false, error: "Sesi tidak valid, silakan login ulang." };
  }
  if (session.user.role?.toLowerCase() !== "admin") {
    return {
      success: false,
      error: "Hanya admin yang bisa menambahkan kegiatan.",
    };
  }

  const parsed = createKegiatanSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }
  const data = parsed.data;

  const existing = await prisma.kegiatan.findUnique({
    where: { kode: data.kode },
  });
  if (existing) {
    return {
      success: false,
      error: `Kode kegiatan "${data.kode}" sudah terdaftar.`,
    };
  }

  const kegiatan = await prisma.kegiatan.create({
    data: {
      kode: data.kode,
      nama: data.nama,
      jenis: data.jenis,
      programCategory: data.programCategory || null,
      pagu: BigInt(data.pagu),
      uraian: data.uraian || null,
      pjId: data.pjId || null,
      statusAnggaran: "DIBUKA",
      wajib: true,
    },
    include: { pj: { select: { id: true, name: true, email: true } } },
  });

  revalidatePath("/admin/master");

  return {
    success: true,
    kegiatan: {
      id: kegiatan.id,
      kode: kegiatan.kode,
      nama: kegiatan.nama,
      jenis: kegiatan.jenis,
      programCategory: kegiatan.programCategory,
      pagu: Number(kegiatan.pagu),
      realisasi: Number(kegiatan.realisasi),
      pj: kegiatan.pj,
    },
  };
}

const updateKegiatanSchema = z.object({
  id: z.string().min(1),
  kode: z.string().min(1, "Kode kegiatan wajib diisi"),
  nama: z.string().min(1, "Nama kegiatan wajib diisi"),
  jenis: z.enum(["APBN", "NON_APBN"]),
  programCategory: z.string().optional(),
  pagu: z.coerce.number().int().positive("Pagu harus lebih dari 0"),
  pjId: z.string().optional(),
  uraian: z.string().optional(),
});

export type UpdateKegiatanInput = z.infer<typeof updateKegiatanSchema>;

type MutateKegiatanResult =
  | {
      success: true;
      kegiatan: {
        id: string;
        kode: string;
        nama: string;
        jenis: string;
        programCategory: string | null;
        pagu: number;
        realisasi: number;
        pj: { id: string; name: string; email: string } | null;
      };
    }
  | { success: false; error: string };

export async function updateKegiatan(
  input: UpdateKegiatanInput,
): Promise<MutateKegiatanResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { success: false, error: "Sesi tidak valid, silakan login ulang." };
  }
  if (session.user.role?.toLowerCase() !== "admin") {
    return {
      success: false,
      error: "Hanya admin yang bisa mengubah kegiatan.",
    };
  }

  const parsed = updateKegiatanSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }
  const data = parsed.data;

  const existingWithSameKode = await prisma.kegiatan.findFirst({
    where: { kode: data.kode, NOT: { id: data.id } },
  });
  if (existingWithSameKode) {
    return {
      success: false,
      error: `Kode kegiatan "${data.kode}" sudah dipakai kegiatan lain.`,
    };
  }

  const target = await prisma.kegiatan.findUnique({ where: { id: data.id } });
  if (!target) {
    return {
      success: false,
      error: "Kegiatan tidak ditemukan (mungkin sudah dihapus).",
    };
  }

  const kegiatan = await prisma.kegiatan.update({
    where: { id: data.id },
    data: {
      kode: data.kode,
      nama: data.nama,
      jenis: data.jenis,
      programCategory: data.programCategory || null,
      pagu: BigInt(data.pagu),
      uraian: data.uraian || null,
      pjId: data.pjId || null,
    },
    include: { pj: { select: { id: true, name: true, email: true } } },
  });

  revalidatePath("/admin/master");

  return {
    success: true,
    kegiatan: {
      id: kegiatan.id,
      kode: kegiatan.kode,
      nama: kegiatan.nama,
      jenis: kegiatan.jenis,
      programCategory: kegiatan.programCategory,
      pagu: Number(kegiatan.pagu),
      realisasi: Number(kegiatan.realisasi),
      pj: kegiatan.pj,
    },
  };
}

type DeleteKegiatanResult =
  { success: true; deletedId: string } | { success: false; error: string };

export async function deleteKegiatan(
  id: string,
): Promise<DeleteKegiatanResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { success: false, error: "Sesi tidak valid, silakan login ulang." };
  }
  if (session.user.role?.toLowerCase() !== "admin") {
    return {
      success: false,
      error: "Hanya admin yang bisa menghapus kegiatan.",
    };
  }

  const target = await prisma.kegiatan.findUnique({ where: { id } });
  if (!target) {
    return {
      success: false,
      error: "Kegiatan tidak ditemukan (mungkin sudah dihapus).",
    };
  }

  await prisma.kegiatan.delete({ where: { id } });

  revalidatePath("/admin/master");

  return { success: true, deletedId: id };
}

type ToggleWajibResult =
  | { success: true; id: string; wajib: boolean }
  | { success: false; error: string };

export async function toggleWajibLapor(
  id: string,
  wajib: boolean,
): Promise<ToggleWajibResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { success: false, error: "Sesi tidak valid, silakan login ulang." };
  }
  if (session.user.role?.toLowerCase() !== "admin") {
    return {
      success: false,
      error: "Hanya admin yang bisa mengubah status wajib lapor.",
    };
  }

  const target = await prisma.kegiatan.findUnique({ where: { id } });
  if (!target) {
    return {
      success: false,
      error: "Kegiatan tidak ditemukan (mungkin sudah dihapus).",
    };
  }

  await prisma.kegiatan.update({
    where: { id },
    data: { wajib },
  });

  revalidatePath("/admin/master");

  return { success: true, id, wajib };
}
