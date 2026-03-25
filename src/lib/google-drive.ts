import { prisma } from "@/lib/db";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_API = "https://www.googleapis.com/drive/v3";

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

export async function getAccessToken(): Promise<string> {
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });

  if (!settings?.driveRefreshToken) {
    throw new Error("Google Drive not connected");
  }

  // Return cached token if still valid (with 60s buffer)
  if (
    settings.driveAccessToken &&
    settings.driveTokenExpiry &&
    new Date(settings.driveTokenExpiry).getTime() > Date.now() + 60_000
  ) {
    return settings.driveAccessToken;
  }

  // Refresh the token
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: settings.driveRefreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status}`);
  }

  const data: TokenResponse = await res.json();
  const expiry = new Date(Date.now() + data.expires_in * 1000);

  await prisma.settings.update({
    where: { id: "singleton" },
    data: {
      driveAccessToken: data.access_token,
      driveTokenExpiry: expiry,
    },
  });

  return data.access_token;
}

async function driveRequest(
  accessToken: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${DRIVE_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
}

async function findFolder(
  accessToken: string,
  name: string,
  parentId: string,
  sharedDriveId: string
): Promise<string | null> {
  const q = `name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const res = await driveRequest(
    accessToken,
    `/files?q=${encodeURIComponent(q)}&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=drive&driveId=${sharedDriveId}&fields=files(id,name)`
  );
  const data = await res.json();
  return data.files?.[0]?.id || null;
}

async function createFolder(
  accessToken: string,
  name: string,
  parentId: string,
  sharedDriveId: string
): Promise<string> {
  const res = await driveRequest(accessToken, "/files?supportsAllDrives=true", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
      driveId: sharedDriveId,
    }),
  });
  const data = await res.json();
  if (!data.id) throw new Error(`Failed to create folder: ${JSON.stringify(data)}`);
  return data.id;
}

async function ensureFolder(
  accessToken: string,
  name: string,
  parentId: string,
  sharedDriveId: string
): Promise<string> {
  const existing = await findFolder(accessToken, name, parentId, sharedDriveId);
  if (existing) return existing;
  return createFolder(accessToken, name, parentId, sharedDriveId);
}

export async function getOrCreateClientFolder(
  clientName: string,
  projectName: string
): Promise<{ folderId: string; folderUrl: string }> {
  const accessToken = await getAccessToken();
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });
  const sharedDriveId = settings?.sharedDriveId || "0AMK9dkBAqTzpUk9PVA";

  // Ensure Projects root folder
  const projectsRootId = await ensureFolder(
    accessToken,
    "Projects",
    sharedDriveId,
    sharedDriveId
  );

  // Ensure client-project folder
  const folderName = `${clientName} - ${projectName}`;
  const projectFolderId = await ensureFolder(
    accessToken,
    folderName,
    projectsRootId,
    sharedDriveId
  );

  // Create subfolders in parallel
  const subfolders = [
    "Estimates",
    "Contracts",
    "Change Orders",
    "Purchase Orders",
    "Media",
    "Invoices",
  ];
  await Promise.all(
    subfolders.map((name) =>
      ensureFolder(accessToken, name, projectFolderId, sharedDriveId)
    )
  );

  return {
    folderId: projectFolderId,
    folderUrl: getDriveFolderUrl(projectFolderId),
  };
}

export async function createProjectFolder(
  projectName: string,
  clientName: string
): Promise<string> {
  const result = await getOrCreateClientFolder(clientName, projectName);
  return result.folderId;
}

export async function uploadFileToDrive(
  folderId: string,
  subfolderName: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ fileId: string; fileUrl: string }> {
  const accessToken = await getAccessToken();
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });
  const sharedDriveId = settings?.sharedDriveId || "0AMK9dkBAqTzpUk9PVA";

  // Find or create subfolder
  const subfolderId = await ensureFolder(
    accessToken,
    subfolderName,
    folderId,
    sharedDriveId
  );

  // Multipart upload
  const boundary = "----DriveUploadBoundary";
  const metadata = JSON.stringify({
    name: fileName,
    parents: [subfolderId],
    driveId: sharedDriveId,
  });

  const bodyParts = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
  ];

  const metaBuffer = Buffer.from(bodyParts[0]);
  const fileHeaderBuffer = Buffer.from(bodyParts[1]);
  const endBuffer = Buffer.from(`\r\n--${boundary}--`);
  const body = Buffer.concat([metaBuffer, fileHeaderBuffer, fileBuffer, endBuffer]);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  const data = await res.json();
  if (!data.id) throw new Error(`Upload failed: ${JSON.stringify(data)}`);

  return {
    fileId: data.id,
    fileUrl: `https://drive.google.com/file/d/${data.id}/view`,
  };
}

export function getDriveFolderUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}
