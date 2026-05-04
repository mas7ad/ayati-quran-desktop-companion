import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

interface ElectronBuilderConfig {
  artifactName?: string;
  publish?: {
    provider?: string;
    url?: string;
  };
}

interface PackageJson {
  build?: ElectronBuilderConfig;
}

function readPackageJson(): PackageJson {
  return JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')) as PackageJson;
}

describe('Electron updater packaging config', () => {
  it('includes the architecture in release artifact names so mac updater selects the right ZIP', () => {
    const packageJson = readPackageJson();

    expect(packageJson.build?.artifactName).toBe('${productName}-${version}-${arch}.${ext}');
  });

  it('publishes updater metadata from the GitHub latest release download feed', () => {
    const packageJson = readPackageJson();

    expect(packageJson.build?.publish).toEqual({
      provider: 'generic',
      url: 'https://github.com/mwijanarko1/ayati-quran-desktop-companion/releases/latest/download',
    });
  });
});
