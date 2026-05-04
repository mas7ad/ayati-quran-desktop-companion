import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

import { shouldHideWindowOnBlur, shouldRevealWindowInactive } from './window-visibility-policy';

describe('shouldHideWindowOnBlur', () => {
  it('keeps the screenshot reflection modal visible when focus changes during capture', () => {
    expect(shouldHideWindowOnBlur('screenshotQuestion')).toBe(false);
  });

  it('still hides transient utility windows on blur', () => {
    expect(shouldHideWindowOnBlur('chatbar')).toBe(true);
    expect(shouldHideWindowOnBlur('petContextMenu')).toBe(true);
  });

  it('wires screenshot blur handling through the visibility policy', () => {
    const mainSource = readFileSync(path.join(process.cwd(), 'src/main/main.ts'), 'utf8');

    expect(mainSource).toContain("shouldHideWindowOnBlur('screenshotQuestion')");
  });

  it('shows the screenshot reflection modal without activating the app window', () => {
    expect(shouldRevealWindowInactive('assistant')).toBe(true);
    expect(shouldRevealWindowInactive('screenshotQuestion')).toBe(true);
    expect(shouldRevealWindowInactive('chatbar')).toBe(false);
    expect(shouldRevealWindowInactive('petContextMenu')).toBe(false);
  });

  it('wires command-triggered windows through inactive show calls', () => {
    const mainSource = readFileSync(path.join(process.cwd(), 'src/main/main.ts'), 'utf8');

    expect(mainSource).toContain("shouldRevealWindowInactive('assistant')");
    expect(mainSource).toContain('assistantWindow.showInactive()');
    expect(mainSource).not.toContain('assistantWindow.focus()');
    expect(mainSource).toContain("shouldRevealWindowInactive('screenshotQuestion')");
    expect(mainSource).toContain('screenshotQuestionWindow.showInactive()');
    expect(mainSource).not.toContain('screenshotQuestionWindow.focus()');
  });

  it('keeps assistant and chatbar shortcut windows mutually exclusive', () => {
    const mainSource = readFileSync(path.join(process.cwd(), 'src/main/main.ts'), 'utf8');

    expect(mainSource).toMatch(
      /function toggleAssistantWindow\(\) \{[\s\S]*chatbarWindow\.hide\(\);[\s\S]*createAssistantWindow\(\);[\s\S]*\}/
    );
    expect(mainSource).toMatch(
      /function toggleChatbarWindow\(\) \{[\s\S]*assistantWindow\.hide\(\);[\s\S]*createChatbarWindow\(\);[\s\S]*\}/
    );
  });

  it('starts reflection prepare then opens the screenshot modal immediately', () => {
    const mainSource = readFileSync(path.join(process.cwd(), 'src/main/main.ts'), 'utf8');

    expect(mainSource).toContain('createScreenshotQuestionWindow()');
    expect(mainSource).toContain('ayahReflectionPrepareInFlight');
    expect(mainSource).toContain("ipcMain.handle('ayah-pending-reflection-result'");
    expect(mainSource).not.toContain("webContents.send('retake-screenshot')");
  });

  it('only plays snap feedback when capture actually succeeds', () => {
    const mainSource = readFileSync(path.join(process.cwd(), 'src/main/main.ts'), 'utf8');

    expect(mainSource).toMatch(/const image = await captureScreen\(\);\s+if \(image\) \{\s+triggerPetCameraSnapFeedback\(\);/);
    expect(mainSource).toMatch(/const result = await captureScreenWithContext\(\);\s+if \(result\) \{\s+triggerPetCameraSnapFeedback\(\);/);
  });
});
