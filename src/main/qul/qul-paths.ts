import { existsSync } from 'fs';
import path from 'path';

import type { App } from 'electron';

/**
 * Resolve bundled QUL asset root (database + font_manifest + Fonts/).
 * In packaged builds, assets are under `process.resourcesPath` (see electron-builder extraResources).
 */
export function resolveQulRoot(app?: App): string | null {
  const envPath = process.env.AYATI_QUL_ROOT;
  if (envPath && existsSync(path.join(envPath, 'qul_rendering.sqlite'))) {
    return envPath;
  }

  if (app) {
    const packagedPath = path.join(process.resourcesPath, 'assets', 'qul');
    if (app.isPackaged && existsSync(path.join(packagedPath, 'qul_rendering.sqlite'))) {
      return packagedPath;
    }
    const devPath = path.join(app.getAppPath(), 'assets', 'qul');
    if (existsSync(path.join(devPath, 'qul_rendering.sqlite'))) {
      return devPath;
    }
  }

  const cwdPath = path.join(process.cwd(), 'assets', 'qul');
  if (existsSync(path.join(cwdPath, 'qul_rendering.sqlite'))) {
    return cwdPath;
  }

  return null;
}

export function resolveManifestFontPath(qulRoot: string, manifestFilePath: string): string {
  const normalized = manifestFilePath.replace(/^Resources\/QUL\//, '').replace(/\\/g, '/');
  return path.join(qulRoot, normalized);
}

/** Reject paths outside the QUL bundle (e.g. arbitrary disk reads from the renderer). */
export function isFontPathWithinQulRoot(qulRoot: string, fontAbsolutePath: string): boolean {
  const resolvedRoot = path.resolve(qulRoot);
  const resolvedFile = path.resolve(fontAbsolutePath);
  if (resolvedFile === resolvedRoot) return false;
  const prefix = resolvedRoot.endsWith(path.sep) ? resolvedRoot : resolvedRoot + path.sep;
  return resolvedFile.startsWith(prefix);
}
