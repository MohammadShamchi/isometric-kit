import { describe, expect, it } from 'vitest';
import { IsoEngine, getSceneBounds } from '../src/index.js';

// Smoke test (task 0.1.2): proves Vitest runs and core ESM resolves.
// Real layout coverage arrives with tasks 0.2-0.7.
describe('core smoke', () => {
  it('projects the grid origin to the screen origin', () => {
    expect(IsoEngine.project(0, 0, 0)).toEqual(IsoEngine.ORIGIN);
  });

  it('returns null bounds for an empty scene', () => {
    expect(getSceneBounds([])).toBeNull();
  });
});
