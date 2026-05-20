export type UpdateMetadataPlatformKey = 'macos-arm64' | 'macos-x64' | 'windows-x64';

export interface UpdateMetadataPlatform {
  url: string;
  sha256: string;
}

export interface UpdateMetadata {
  version: string;
  pub_date: string;
  notes: string;
  platforms: Partial<Record<UpdateMetadataPlatformKey, UpdateMetadataPlatform>>;
}

export interface SelectedUpdateMetadata {
  version: string;
  pubDate: string;
  notes: string;
  url: string;
  sha256: string;
}

export function getUpdateMetadataPlatformKey(
  platform: NodeJS.Platform,
  arch: string,
): UpdateMetadataPlatformKey | null {
  if (platform === 'darwin') {
    if (arch === 'arm64') return 'macos-arm64';
    if (arch === 'x64') return 'macos-x64';
  }

  if (platform === 'win32' && arch === 'x64') {
    return 'windows-x64';
  }

  return null;
}

function normalizeVersion(version: string): number[] {
  const normalized = version.trim().replace(/^v/i, '').split(/[+-]/)[0] ?? '';
  return normalized.split('.').map((part) => {
    const match = part.match(/^\d+/);
    return match ? Number(match[0]) : 0;
  });
}

export function isVersionGreater(candidate: string, current: string): boolean {
  const candidateParts = normalizeVersion(candidate);
  const currentParts = normalizeVersion(current);
  const length = Math.max(candidateParts.length, currentParts.length, 3);

  for (let index = 0; index < length; index += 1) {
    const candidatePart = candidateParts[index] ?? 0;
    const currentPart = currentParts[index] ?? 0;
    if (candidatePart > currentPart) return true;
    if (candidatePart < currentPart) return false;
  }

  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseUpdateMetadata(raw: string): UpdateMetadata {
  const parsed = JSON.parse(raw) as unknown;
  if (!isRecord(parsed)) throw new Error('Update metadata must be a JSON object.');
  if (typeof parsed.version !== 'string' || parsed.version.trim().length === 0) {
    throw new Error('Update metadata is missing a version.');
  }
  if (typeof parsed.pub_date !== 'string') throw new Error('Update metadata is missing pub_date.');
  if (typeof parsed.notes !== 'string') throw new Error('Update metadata is missing notes.');
  if (!isRecord(parsed.platforms)) throw new Error('Update metadata is missing platforms.');

  const platforms: UpdateMetadata['platforms'] = {};
  for (const key of ['macos-arm64', 'macos-x64', 'windows-x64'] as const) {
    const platform = parsed.platforms[key];
    if (!isRecord(platform)) continue;
    if (typeof platform.url !== 'string' || platform.url.trim().length === 0) continue;
    if (typeof platform.sha256 !== 'string') continue;
    platforms[key] = {
      url: platform.url,
      sha256: platform.sha256,
    };
  }

  return {
    version: parsed.version,
    pub_date: parsed.pub_date,
    notes: parsed.notes,
    platforms,
  };
}

export function selectUpdateFromMetadata(
  metadata: UpdateMetadata,
  platformKey: UpdateMetadataPlatformKey,
): SelectedUpdateMetadata | null {
  const platform = metadata.platforms[platformKey];
  if (!platform) return null;

  return {
    version: metadata.version,
    pubDate: metadata.pub_date,
    notes: metadata.notes,
    url: platform.url,
    sha256: platform.sha256,
  };
}
