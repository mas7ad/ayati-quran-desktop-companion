import type { PetAppearanceId } from '../../shared/pet-appearance';

import ayahSheet from '../../../assets/pets/ayah/spritesheet.webp';
import boltSheet from '../../../assets/pets/bolt/spritesheet.webp';
import cloudletSheet from '../../../assets/pets/cloudlet/spritesheet.webp';
import cosmoSheet from '../../../assets/pets/cosmo/spritesheet.webp';
import bobaSheet from '../../../assets/pets/boba/spritesheet.webp';

import ayahAtlasJson from '../../../assets/pets/ayah/atlas.json';
import boltAtlasJson from '../../../assets/pets/bolt/atlas.json';
import cloudletAtlasJson from '../../../assets/pets/cloudlet/atlas.json';
import cosmoAtlasJson from '../../../assets/pets/cosmo/atlas.json';
import bobaAtlasJson from '../../../assets/pets/boba/atlas.json';

/**
 * Sprite metadata for a pet `spritesheet.webp` + `atlas.json` pair.
 * All Codex pets in this repo share the same sheet pixel size and clip layout.
 */

export type PetClipId =
  | 'idle'
  | 'running-right'
  | 'running-left'
  | 'waving'
  | 'jumping'
  | 'failed'
  | 'waiting'
  | 'running'
  | 'review';

export type PetSpriteAtlasClip = {
  start?: number;
  length: number;
  fps?: number;
  stripPath?: string;
  columns?: number;
};

export type PetSpriteAtlas = {
  frameWidth: number;
  frameHeight: number;
  columns: number;
  sheetWidth: number;
  sheetHeight: number;
  fps: number;
  clips: Record<PetClipId, PetSpriteAtlasClip>;
};

export type PetClipFrameSource = {
  mode: 'spritesheet' | 'strip';
  imageUrl: string;
  start: number;
  length: number;
  fps: number;
  columns: number;
  frameWidth: number;
  frameHeight: number;
  expectedImageWidth: number;
  expectedImageHeight: number;
};

const CLIP_ORDER: PetClipId[] = [
  'idle',
  'running-right',
  'running-left',
  'waving',
  'jumping',
  'failed',
  'waiting',
  'running',
  'review',
];

const CLIP_SET = new Set<string>(CLIP_ORDER);

const ATLASES: Record<PetAppearanceId, PetSpriteAtlas> = {
  ayah: ayahAtlasJson as PetSpriteAtlas,
  bolt: boltAtlasJson as PetSpriteAtlas,
  cloudlet: cloudletAtlasJson as PetSpriteAtlas,
  cosmo: cosmoAtlasJson as PetSpriteAtlas,
  boba: bobaAtlasJson as PetSpriteAtlas,
};

/** Default atlas (Ayah); use for tests and fallbacks. */
export const AYAH_ATLAS = ATLASES.ayah;

export function getAtlasForAppearance(id: PetAppearanceId): PetSpriteAtlas {
  return ATLASES[id] ?? ATLASES.ayah;
}

export const PET_SPRITESHEET_URL: Record<PetAppearanceId, string> = {
  ayah: ayahSheet,
  bolt: boltSheet,
  cloudlet: cloudletSheet,
  cosmo: cosmoSheet,
  boba: bobaSheet,
};

const PET_WEBP_URLS = import.meta.glob('../../../assets/pets/**/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export function getSpritesheetUrlForAppearance(id: PetAppearanceId): string {
  return PET_SPRITESHEET_URL[id] ?? PET_SPRITESHEET_URL.ayah;
}

function getClipStripUrlForAppearance(id: PetAppearanceId, stripPath: string): string {
  if (/^(?:[a-z]+:)?\/\//i.test(stripPath) || stripPath.startsWith('/')) {
    return stripPath;
  }

  const normalizedStripPath = stripPath.replace(/^\.?\//, '');
  const scopedPath = normalizedStripPath.includes('/')
    ? normalizedStripPath
    : `pets/${id}/${normalizedStripPath}`;
  const modulePath = `../../../assets/${scopedPath}`;

  return PET_WEBP_URLS[modulePath] ?? stripPath;
}

export function isPetClipId(value: string): value is PetClipId {
  return CLIP_SET.has(value);
}

export function getClipRange(clip: PetClipId, atlas: PetSpriteAtlas = AYAH_ATLAS): PetSpriteAtlasClip {
  const range = atlas.clips[clip];
  if (!range) {
    return atlas.clips.idle;
  }
  return range;
}

export function getClipFps(clip: PetClipId, atlas: PetSpriteAtlas = AYAH_ATLAS): number {
  return getClipRange(clip, atlas).fps ?? atlas.fps;
}

export function getClipFrameSource(
  appearanceId: PetAppearanceId,
  clip: PetClipId,
  atlas: PetSpriteAtlas = getAtlasForAppearance(appearanceId),
): PetClipFrameSource {
  const range = getClipRange(clip, atlas);
  const fps = range.fps ?? atlas.fps;

  if (range.stripPath) {
    const columns = range.columns ?? range.length;
    return {
      mode: 'strip',
      imageUrl: getClipStripUrlForAppearance(appearanceId, range.stripPath),
      start: range.start ?? 0,
      length: range.length,
      fps,
      columns,
      frameWidth: atlas.frameWidth,
      frameHeight: atlas.frameHeight,
      expectedImageWidth: atlas.frameWidth * columns,
      expectedImageHeight: atlas.frameHeight,
    };
  }

  return {
    mode: 'spritesheet',
    imageUrl: getSpritesheetUrlForAppearance(appearanceId),
    start: range.start ?? 0,
    length: range.length,
    fps,
    columns: atlas.columns,
    frameWidth: atlas.frameWidth,
    frameHeight: atlas.frameHeight,
    expectedImageWidth: atlas.sheetWidth,
    expectedImageHeight: atlas.sheetHeight,
  };
}
