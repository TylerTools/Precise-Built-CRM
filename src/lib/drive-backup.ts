/**
 * Google Drive backup helper for settings.
 * Uploads a JSON snapshot to "Precise Built / Backups / settings-[date].json"
 */

interface SettingsWithDrive {
  driveRefreshToken?: string | null;
  [key: string]: unknown;
}

export async function backupSettingsToDrive(settings: SettingsWithDrive) {
  const refreshToken = settings.driveRefreshToken;
  if (!refreshToken) {
    console.log("[Drive] No refresh token — skipping backup");
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log("[Drive] Google OAuth credentials not configured — skipping backup");
    return;
  }

  // Exchange refresh token for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Failed to refresh Drive token: ${tokenRes.status}`);
  }

  const { access_token } = await tokenRes.json();

  // Find or create "Precise Built" folder
  const pbFolderId = await findOrCreateFolder(access_token, "Precise Built", "root");
  const backupsFolderId = await findOrCreateFolder(access_token, "Backups", pbFolderId);

  // Upload settings JSON
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `settings-${dateStr}.json`;

  // Remove sensitive fields from snapshot
  const snapshot = { ...settings };
  delete snapshot.driveRefreshToken;

  const metadata = {
    name: fileName,
    parents: [backupsFolderId],
    mimeType: "application/json",
  };

  const boundary = "settings_backup_boundary";
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
    JSON.stringify(snapshot, null, 2) +
    `\r\n--${boundary}--`;

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!uploadRes.ok) {
    throw new Error(`Drive upload failed: ${uploadRes.status}`);
  }

  console.log(`[Drive] Backed up settings as ${fileName}`);
}

async function findOrCreateFolder(
  accessToken: string,
  name: string,
  parentId: string
): Promise<string> {
  // Search for existing folder
  const q = `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const { files } = await searchRes.json();
  if (files && files.length > 0) {
    return files[0].id;
  }

  // Create folder
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });

  const folder = await createRes.json();
  return folder.id;
}
