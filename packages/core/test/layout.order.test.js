import { describe, expect, it } from 'vitest';
import { rankNodes } from '../src/layout/rank.js';
import { orderWithinRanks } from '../src/layout/order.js';

describe('orderWithinRanks', () => {
  it('resolves the classic 2-rank crossing (a->d, b->c)', () => {
    // rank0: [a, b]  rank1: [c, d]
    // With links a->d and b->c, the initial order [c, d] is crossed.
    // Barycenter of c = pos of b = 1; barycenter of d = pos of a = 0.
    // Correct uncrossed order: d (index 0), c (index 1).
    const ids = ['a', 'b', 'c', 'd'];
    const links = [
      { from: 'a', to: 'd' },
      { from: 'b', to: 'c' },
    ];
    // Build rank using rankNodes so the test exercises the real pipeline.
    // a and b have no incoming edges → rank 0; c and d are targets → rank 1.
    const rank = rankNodes(ids, links);
    expect(rank.get('a')).toBe(0);
    expect(rank.get('b')).toBe(0);
    expect(rank.get('c')).toBe(1);
    expect(rank.get('d')).toBe(1);

    const v = orderWithinRanks(rank, ids, links);

    // rank-0 order must also be consistent: a=0, b=1 (their input order is preserved
    // because they have no rank-(-1) reference on the first down-sweep).
    expect(v.get('a')).toBe(0);
    expect(v.get('b')).toBe(1);

    // rank-1 must be uncrossed: d aligns with a (pos 0), c aligns with b (pos 1).
    expect(v.get('d')).toBe(0);
    expect(v.get('c')).toBe(1);
  });

  it('is deterministic: two calls on equal input return deep-equal maps', () => {
    const ids = ['a', 'b', 'c', 'd'];
    const links = [
      { from: 'a', to: 'd' },
      { from: 'b', to: 'c' },
    ];
    const rank = rankNodes(ids, links);

    const v1 = orderWithinRanks(rank, ids, links);
    const v2 = orderWithinRanks(rank, ids, links);

    expect(Object.fromEntries(v1)).toEqual(Object.fromEntries(v2));
  });

  it('preserves input order for nodes with no cross-rank neighbors (stable tie-break)', () => {
    // Three isolated nodes: all land on rank 0, no links.
    // Expected v: x=0, y=1, z=2 (input order).
    const ids = ['x', 'y', 'z'];
    const links = [];
    const rank = rankNodes(ids, links);

    // All three should be rank 0 (no edges).
    expect(rank.get('x')).toBe(0);
    expect(rank.get('y')).toBe(0);
    expect(rank.get('z')).toBe(0);

    const v = orderWithinRanks(rank, ids, links);

    expect(v.get('x')).toBe(0);
    expect(v.get('y')).toBe(1);
    expect(v.get('z')).toBe(2);
  });

  it('handles a single node without throwing', () => {
    const ids = ['solo'];
    const links = [];
    const rank = rankNodes(ids, links);
    const v = orderWithinRanks(rank, ids, links);
    expect(v.get('solo')).toBe(0);
  });

  it('ignores links whose endpoints are not both in nodeIds', () => {
    const ids = ['a', 'b'];
    const links = [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'ghost' }, // ghost not in ids
    ];
    const rank = rankNodes(ids, links);
    // Should not throw and should return valid v indices.
    const v = orderWithinRanks(rank, ids, links);
    expect(v.has('a')).toBe(true);
    expect(v.has('b')).toBe(true);
    expect(v.has('ghost')).toBe(false);
  });
});
