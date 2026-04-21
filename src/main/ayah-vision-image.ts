import sharp from 'sharp';

/** Vision APIs are faster with smaller images; full retina PNGs add seconds of upload + token cost. */
const MAX_VISION_EDGE_PX = 1280;
const JPEG_QUALITY = 82;

/**
 * Downscale large screenshots before sending to the vision model.
 * Returns the original data URL if already small or if processing fails.
 */
export async function shrinkImageDataUrlForVisionAnalysis(dataUrl: string): Promise<string> {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return dataUrl;

  try {
    const buf = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
    const meta = await sharp(buf).metadata();
    if (!meta.width || !meta.height) return dataUrl;
    if (Math.max(meta.width, meta.height) <= MAX_VISION_EDGE_PX) return dataUrl;

    const out = await sharp(buf)
      .resize(MAX_VISION_EDGE_PX, MAX_VISION_EDGE_PX, { fit: 'inside' })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    return `data:image/jpeg;base64,${out.toString('base64')}`;
  } catch (error) {
    console.warn('[ayah-vision] Failed to downscale screenshot for vision; using original.', error);
    return dataUrl;
  }
}
