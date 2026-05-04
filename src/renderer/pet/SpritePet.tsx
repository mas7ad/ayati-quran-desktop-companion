import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { PetAppearanceId } from '../../shared/pet-appearance';

import {
  getAtlasForAppearance,
  getClipFrameSource,
  type PetSpriteAtlas,
  type PetClipId,
} from './pet-sprite-atlas';

/** Max on-screen height (px); width follows `frameWidth` / `frameHeight` aspect. */
const DISPLAY_MAX_HEIGHT_PX = 120;

export interface SpritePetProps {
  appearanceId: PetAppearanceId;
  clip: PetClipId;
  atlasOverride?: PetSpriteAtlas;
}

export const SpritePet: React.FC<SpritePetProps> = ({ appearanceId, clip, atlasOverride }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetRef = useRef<HTMLImageElement | null>(null);
  const atlas = atlasOverride ?? getAtlasForAppearance(appearanceId);
  const frameSource = useMemo(
    () => getClipFrameSource(appearanceId, clip, atlas),
    [appearanceId, atlas, clip],
  );
  const { frameWidth, frameHeight, columns } = frameSource;
  const [frameOffset, setFrameOffset] = useState(0);
  const [sheetReady, setSheetReady] = useState(0);
  const clipRef = useRef(clip);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const reducedMotion = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  const scale = DISPLAY_MAX_HEIGHT_PX / frameHeight;
  const displayW = Math.round(frameWidth * scale);
  const displayH = Math.round(frameHeight * scale);

  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const bufW = Math.max(1, Math.round(displayW * dpr));
    const bufH = Math.max(1, Math.round(displayH * dpr));

    if (canvas.width !== bufW || canvas.height !== bufH) {
      canvas.width = bufW;
      canvas.height = bufH;
    }
    canvas.style.width = `${displayW}px`;
    canvas.style.height = `${displayH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, bufW, bufH };
  }, [displayH, displayW]);

  const clearCanvas = useCallback(() => {
    const prepared = prepareCanvas();
    if (!prepared) return;

    prepared.ctx.clearRect(0, 0, prepared.bufW, prepared.bufH);
  }, [prepareCanvas]);

  useEffect(() => {
    let cancelled = false;
    sheetRef.current = null;
    setFrameOffset(0);
    lastTickRef.current = null;
    setSheetReady(0);
    clearCanvas();
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (cancelled) return;
      sheetRef.current = img;
      if (
        img.naturalWidth !== frameSource.expectedImageWidth ||
        img.naturalHeight !== frameSource.expectedImageHeight
      ) {
        console.warn('[SpritePet] Sprite image dimensions do not match atlas:', {
          appearanceId,
          clip,
          mode: frameSource.mode,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          atlasImageWidth: frameSource.expectedImageWidth,
          atlasImageHeight: frameSource.expectedImageHeight,
        });
      }
      setSheetReady((n) => n + 1);
    };
    img.onerror = () => {
      console.warn('[SpritePet] Failed to load sprite image:', frameSource.imageUrl);
    };
    img.src = frameSource.imageUrl;
    return () => {
      cancelled = true;
    };
  }, [appearanceId, clearCanvas, clip, frameSource]);

  useEffect(() => {
    if (clipRef.current !== clip) {
      clipRef.current = clip;
      setFrameOffset(0);
      lastTickRef.current = null;
    }
  }, [clip]);

  const paintFrame = useCallback(
    (absoluteFrame: number) => {
      const canvas = canvasRef.current;
      const sheet = sheetRef.current;
      if (!canvas || !sheet || !sheet.complete || sheet.naturalWidth < 1) return;

      const prepared = prepareCanvas();
      if (!prepared) return;

      const col = absoluteFrame % columns;
      const row = Math.floor(absoluteFrame / columns);
      const sx = col * frameWidth;
      const sy = row * frameHeight;

      prepared.ctx.imageSmoothingEnabled = false;
      prepared.ctx.clearRect(0, 0, prepared.bufW, prepared.bufH);
      prepared.ctx.drawImage(sheet, sx, sy, frameWidth, frameHeight, 0, 0, displayW, displayH);
    },
    [columns, displayH, displayW, frameHeight, frameWidth, prepareCanvas],
  );

  useEffect(() => {
    paintFrame(frameSource.start + frameOffset);
  }, [appearanceId, frameOffset, frameSource.start, paintFrame, sheetReady]);

  useEffect(() => {
    if (reducedMotion) {
      return undefined;
    }

    const tick = (now: number) => {
      const frameMs = 1000 / Math.max(1, frameSource.fps);
      if (lastTickRef.current === null) {
        lastTickRef.current = now;
      }
      const elapsed = now - lastTickRef.current;
      if (elapsed >= frameMs) {
        const steps = Math.floor(elapsed / frameMs);
        lastTickRef.current += steps * frameMs;
        setFrameOffset((prev) => (prev + steps) % Math.max(1, frameSource.length));
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTickRef.current = null;
    };
  }, [clip, frameSource.fps, frameSource.length, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="ayah-sprite-pet"
      data-pet-appearance={appearanceId}
      className="ayah-sprite-pet"
      aria-hidden="true"
      style={{
        display: 'block',
        flexShrink: 0,
        imageRendering: 'pixelated',
      }}
    />
  );
};
