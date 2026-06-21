import { describe, expect, it } from 'vitest';
import { rankNodes } from '../src/layout/rank.js';

describe('rankNodes', () => {
  it('assigns strictly increasing ranks along a chain (R0.7)', () => {
    const ids = ['a', 'b', 'c'];
    const links = [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
    ];
    const rank = rankNodes(ids, links);
    expect(rank.get('a')).toBe(0);
    expect(rank.get('b')).toBe(1);
    expect(rank.get('c')).toBe(2);
  });

  it('gives nodes with no incoming edges rank 0 (R0.7)', () => {
    const ids = ['a', 'b', 'c'];
    const links = [
      { from: 'a', to: 'c' },
      { from: 'b', to: 'c' },
    ];
    const rank = rankNodes(ids, links);
    expect(rank.get('a')).toBe(0);
    expect(rank.get('b')).toBe(0);
    expect(rank.get('c')).toBe(1);
  });

  it('uses the longest path for diamonds', () => {
    // a->b->d plus a->d : d is rank 2 (longest path), not 1.
    const ids = ['a', 'b', 'd'];
    const links = [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'd' },
      { from: 'a', to: 'd' },
    ];
    const rank = rankNodes(ids, links);
    expect(rank.get('a')).toBe(0);
    expect(rank.get('b')).toBe(1);
    expect(rank.get('d')).toBe(2);
  });

  it('terminates on a cycle and produces finite, non-negative ranks (R0.4)', () => {
    const ids = ['a', 'b', 'c'];
    const links = [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
      { from: 'c', to: 'a' },
    ];
    const rank = rankNodes(ids, links);
    for (const id of ids) {
      expect(Number.isFinite(rank.get(id))).toBe(true);
      expect(rank.get(id)).toBeGreaterThanOrEqual(0);
    }
  });

  it('handles a self-loop without hanging (R0.4)', () => {
    const ids = ['a'];
    const links = [{ from: 'a', to: 'a' }];
    const rank = rankNodes(ids, links);
    expect(rank.get('a')).toBe(0);
  });

  it('is invariant to link input order for acyclic graphs (R0.2)', () => {
    const ids = ['a', 'b', 'c'];
    const forward = [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
    ];
    const shuffled = [
      { from: 'b', to: 'c' },
      { from: 'a', to: 'b' },
    ];
    expect(Object.fromEntries(rankNodes(ids, forward))).toEqual(
      Object.fromEntries(rankNodes(ids, shuffled)),
    );
  });

  it('ignores links whose endpoints fall outside the node set', () => {
    const ids = ['a', 'b'];
    const links = [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'x' },
    ];
    const rank = rankNodes(ids, links);
    expect(rank.get('a')).toBe(0);
    expect(rank.get('b')).toBe(1);
    expect(rank.has('x')).toBe(false);
  });
});
