export const googleDriveClientId =
  process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID?.trim() || '';

export const googleDriveFolderId =
  process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID?.trim() || '';

export const googleDriveScope = 'https://www.googleapis.com/auth/drive';

export const hasGoogleDriveUploadConfig =
  googleDriveClientId.length > 0 && googleDriveFolderId.length > 0;

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type GoogleAccounts = {
  oauth2: {
    initTokenClient: (config: {
      client_id: string;
      scope: string;
      callback: (response: GoogleTokenResponse) => void;
    }) => GoogleTokenClient;
  };
};

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

let googleIdentityPromise: Promise<void> | null = null;

async function loadScript(src: string) {
  if (typeof window === 'undefined') {
    throw new Error('Google Drive uploads can only run in the browser.');
  }

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        resolve();
        return;
      }

      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true';
        resolve();
      },
      { once: true }
    );
    script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
      once: true,
    });
    document.head.appendChild(script);
  });
}

export async function loadGoogleIdentityServices() {
  if (!googleIdentityPromise) {
    googleIdentityPromise = loadScript('https://accounts.google.com/gsi/client');
  }

  await googleIdentityPromise;

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services did not initialize correctly.');
  }
}

function escapeDriveQuery(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function getDriveError(response: Response) {
  try {
    const payload = (await response.json()) as {
      error?: {
        message?: string;
      };
    };

    if (payload.error?.message) {
      return payload.error.message;
    }
  } catch {
    return null;
  }

  return null;
}

async function driveRequest<T>(
  url: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const driveMessage = await getDriveError(response);
    throw new Error(driveMessage || 'Google Drive request failed.');
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export async function requestGoogleDriveAccessToken(prompt: 'consent' | '' = 'consent') {
  if (!hasGoogleDriveUploadConfig) {
    throw new Error(
      'Google Drive upload is not configured. Add NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID.'
    );
  }

  await loadGoogleIdentityServices();

  return await new Promise<string>((resolve, reject) => {
    const tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: googleDriveClientId,
      scope: googleDriveScope,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }

        if (!response.access_token) {
          reject(new Error('Google Drive did not return an access token.'));
          return;
        }

        resolve(response.access_token);
      },
    });

    tokenClient.requestAccessToken({ prompt });
  });
}

async function findChildFolderId(
  accessToken: string,
  parentFolderId: string,
  folderName: string
) {
  const query = [
    `mimeType = 'application/vnd.google-apps.folder'`,
    `name = '${escapeDriveQuery(folderName)}'`,
    `'${escapeDriveQuery(parentFolderId)}' in parents`,
    'trashed = false',
  ].join(' and ');

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', query);
  url.searchParams.set('fields', 'files(id,name)');
  url.searchParams.set('pageSize', '1');
  url.searchParams.set('includeItemsFromAllDrives', 'true');
  url.searchParams.set('supportsAllDrives', 'true');

  const response = await driveRequest<{ files: Array<{ id: string; name: string }> }>(
    url.toString(),
    accessToken
  );

  return response.files[0]?.id || null;
}

async function createFolder(
  accessToken: string,
  parentFolderId: string,
  folderName: string
) {
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('fields', 'id,name');
  url.searchParams.set('supportsAllDrives', 'true');

  const response = await driveRequest<{ id: string; name: string }>(url.toString(), accessToken, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    }),
  });

  return response.id;
}

export async function ensureGoogleDriveFolderPath(
  accessToken: string,
  rootFolderId: string,
  folderSegments: string[]
) {
  let currentFolderId = rootFolderId;

  for (const segment of folderSegments) {
    const cleanSegment = segment.trim();
    if (!cleanSegment) continue;

    const existingFolderId = await findChildFolderId(accessToken, currentFolderId, cleanSegment);
    currentFolderId =
      existingFolderId || (await createFolder(accessToken, currentFolderId, cleanSegment));
  }

  return currentFolderId;
}

type UploadResourceInput = {
  accessToken: string;
  rootFolderId: string;
  file: File;
  folderSegments: string[];
  fileName: string;
  description?: string;
};

export async function uploadFileToGoogleDrive({
  accessToken,
  rootFolderId,
  file,
  folderSegments,
  fileName,
  description,
}: UploadResourceInput) {
  const targetFolderId = await ensureGoogleDriveFolderPath(
    accessToken,
    rootFolderId,
    folderSegments
  );

  const metadata = {
    name: fileName,
    parents: [targetFolderId],
    description: description || '',
  };

  const boundary = `campustutor-${Date.now()}`;
  const body = new Blob([
    `--${boundary}\r\n`,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    `${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\n`,
    `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
    file,
    `\r\n--${boundary}--`,
  ]);

  const url = new URL('https://www.googleapis.com/upload/drive/v3/files');
  url.searchParams.set('uploadType', 'multipart');
  url.searchParams.set('supportsAllDrives', 'true');
  url.searchParams.set('fields', 'id,name,webViewLink,webContentLink');

  return await driveRequest<{
    id: string;
    name: string;
    webViewLink?: string;
    webContentLink?: string;
  }>(url.toString(), accessToken, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
}
