/**
 * Sprite draws at most ~120px tall (`SpritePet`); width scales with atlas aspect (~112px for Ayah).
 * Keep the BrowserWindow just slightly larger than that footprint so the frame hugs the icon.
 *
 * Electron notes: transparent windows below ~162px can mis-render on some external/4K setups
 * (https://github.com/electron/electron/issues/44884). This app calls `app.disableHardwareAcceleration()`
 * in main; if the pet panel ever renders opaque on your display, try raising these toward 162.
 */
export const PET_WINDOW_SAFE_TRANSPARENT_MIN_PX = 162;

export const PET_WINDOW_WIDTH = 130;
export const PET_WINDOW_HEIGHT = 130;
