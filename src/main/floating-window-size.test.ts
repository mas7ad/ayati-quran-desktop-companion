import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('floating window sizes', () => {
  it('keeps the reflect-on-screen modal the same size as the assistant modal', () => {
    const mainSource = readFileSync(path.join(process.cwd(), 'src/main/main.ts'), 'utf8');

    expect(mainSource).toContain('const ASSISTANT_WINDOW_WIDTH = 400;');
    expect(mainSource).toContain('const ASSISTANT_WINDOW_HEIGHT = 500;');
    expect(mainSource).toContain('const SCREENSHOT_QUESTION_WIDTH = ASSISTANT_WINDOW_WIDTH;');
    expect(mainSource).toContain('const SCREENSHOT_QUESTION_HEIGHT = ASSISTANT_WINDOW_HEIGHT;');
  });
});
