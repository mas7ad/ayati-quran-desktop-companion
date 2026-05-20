import { describe, expect, it } from 'vitest';

import {
  getUpdateMetadataPlatformKey,
  isVersionGreater,
  parseUpdateMetadata,
  selectUpdateFromMetadata,
} from './update-metadata';

describe('website update metadata', () => {
  it('maps supported desktop platforms to latest.json platform keys', () => {
    expect(getUpdateMetadataPlatformKey('darwin', 'arm64')).toBe('macos-arm64');
    expect(getUpdateMetadataPlatformKey('darwin', 'x64')).toBe('macos-x64');
    expect(getUpdateMetadataPlatformKey('win32', 'x64')).toBe('windows-x64');
    expect(getUpdateMetadataPlatformKey('linux', 'x64')).toBeNull();
  });

  it('compares semantic versions with optional v prefixes', () => {
    expect(isVersionGreater('v0.1.1', '0.1.0')).toBe(true);
    expect(isVersionGreater('0.2.0', '0.1.9')).toBe(true);
    expect(isVersionGreater('0.1.0', '0.1.0')).toBe(false);
    expect(isVersionGreater('0.0.9', '0.1.0')).toBe(false);
  });

  it('parses and selects the current platform update entry', () => {
    const metadata = parseUpdateMetadata(JSON.stringify({
      version: '0.1.1',
      pub_date: '2026-05-19T12:00:00Z',
      notes: 'Release notes',
      platforms: {
        'macos-arm64': {
          url: 'https://example.com/Ayati-mac-arm64.dmg',
          sha256: 'abc123',
        },
      },
    }));

    expect(selectUpdateFromMetadata(metadata, 'macos-arm64')).toEqual({
      version: '0.1.1',
      pubDate: '2026-05-19T12:00:00Z',
      notes: 'Release notes',
      url: 'https://example.com/Ayati-mac-arm64.dmg',
      sha256: 'abc123',
    });
  });
});
