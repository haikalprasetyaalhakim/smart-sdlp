import { google } from "googleapis";
import { Readable } from "stream";

function getDriveClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    return null;
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

export function isGoogleDriveConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_DRIVE_FOLDER_ID
  );
}

const CATEGORY_FOLDER_MAP: Record<string, string> = {
  SK: "01. SK & Surat Tugas",
  DIPA: "02. DIPA & POK",
  KONTRAK: "03. Kontrak & SPK",
  LAPORAN: "04. Laporan SMART",
  ESURAT: "05. E-Surat",
  LAINNYA: "06. Dokumen Lainnya",
};

/**
 * Mencari atau otomatis membuat folder berjenjang di Google Drive (Mendukung Shared Drive)
 */
export async function getOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  folderName: string,
  parentId: string,
): Promise<string> {
  const query = `name = '${folderName.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const res = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    spaces: "drive",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }

  const createRes = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    supportsAllDrives: true,
    fields: "id",
  });

  return createRes.data.id!;
}

/**
 * Mengunggah file ke Google Drive dengan struktur folder rapi:
 * Root Shared Drive / [Tahun] / [Kategori] / [Nama File]
 */
export async function uploadFileToGoogleDrive({
  fileName,
  mimeType,
  buffer,
  kategori,
  tahun,
}: {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  kategori: string;
  tahun: string;
}): Promise<{
  fileId: string;
  webViewLink: string;
}> {
  const drive = getDriveClient();
  if (!drive) {
    throw new Error("Kredensial Google Drive API belum lengkap di file .env.");
  }

  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID belum diset di .env.");
  }

  // 1. Folder Tahun (misal: "2026")
  const yearFolderId = await getOrCreateFolder(drive, tahun, rootFolderId);

  // 2. Folder Kategori (misal: "01. SK & Surat Tugas")
  const categoryFolderName =
    CATEGORY_FOLDER_MAP[kategori] || "06. Dokumen Lainnya";
  const targetFolderId = await getOrCreateFolder(
    drive,
    categoryFolderName,
    yearFolderId,
  );

  // 3. Upload File Stream
  const readableStream = new Readable();
  readableStream.push(buffer);
  readableStream.push(null);

  const fileRes = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [targetFolderId],
    },
    media: {
      mimeType: mimeType || "application/octet-stream",
      body: readableStream,
    },
    supportsAllDrives: true,
    fields: "id, webViewLink",
  });

  const fileId = fileRes.data.id!;

  // 4. Set Permission agar bisa dibaca via Tautan
  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
      supportsAllDrives: true,
    });
  } catch (err) {
    console.warn("Permission note:", err);
  }

  return {
    fileId,
    webViewLink:
      fileRes.data.webViewLink ||
      `https://drive.google.com/file/d/${fileId}/view`,
  };
}

/**
 * Memvalidasi apakah URL merupakan format resmi Google Drive atau Google Docs/Sheets
 */
export function isValidGoogleDriveUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();

  // Mendukung:
  // - https://drive.google.com/file/d/...
  // - https://drive.google.com/drive/folders/... atau /drive/u/0/folders/...
  // - https://drive.google.com/open?id=...
  // - https://docs.google.com/document/d/...
  // - https://docs.google.com/spreadsheets/d/...
  // - https://docs.google.com/presentation/d/...
  const gdrivePattern =
    /^https?:\/\/(drive\.google\.com\/(file\/d\/|drive\/folders\/|drive\/u\/\d+\/folders\/|open\?id=)|docs\.google\.com\/(document\/d\/|spreadsheets\/d\/|presentation\/d\/|forms\/d\/))[a-zA-Z0-9_-]+/i;

  return gdrivePattern.test(trimmed);
}
