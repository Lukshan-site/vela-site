// Helpers for working with Google Drive shared video links.

const ID_PATTERNS = [
  /\/file\/d\/([^/?#]+)/, // https://drive.google.com/file/d/FILE_ID/view
  /[?&]id=([^&#]+)/, // https://drive.google.com/open?id=FILE_ID
  /\/d\/([^/?#]+)/, // any other /d/<id>
];

export function extractDriveId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // If it already looks like a bare ID (33+ alnum chars, no slashes), accept it.
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed;
  for (const pattern of ID_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function embedUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

// Auto-thumbnail URL — no API key required. The =w<width> tail asks for a sized variant.
export function thumbnailUrl(fileId: string, width = 640): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=w${width}`;
}
