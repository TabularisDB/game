// Reachability of pickups and blocks.
// - plugins: some column within ±3 tiles needs a standable floor at most
//   5 rows below (the jump apex covers ~5 rows above the feet).
// - '?'/'I'/'M' blocks: the column below (±1) needs a standable floor with
//   the block 2..5 rows above it — close enough to head-bump, with room to
//   stand underneath.
// Run: node test/validate-plugins.js

import { LEVELS } from '../js/levels.js';

const SOLID = new Set(['#', 'B', 'b', '|', 'T', '?', 'I', 'M', 'R']);
let fail = 0, total = 0, blocks = 0;

LEVELS.forEach((world, wi) => world.forEach((lvl, li) => {
  const rows = lvl.gen().map;
  const H = rows.length, W = rows[0].length;
  const floorBelow = (cx, y) => {
    for (let fy = y + 1; fy < H; fy++) {
      const ch = rows[fy][cx];
      if (SOLID.has(ch) || ch === '=') return fy;
    }
    return -1;
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ch = rows[y][x];
      if (ch === 'p') {
        total++;
        let ok = false;
        for (let cx = Math.max(0, x - 3); cx <= Math.min(W - 1, x + 3) && !ok; cx++) {
          const fy = floorBelow(cx, y);
          if (fy >= 0 && fy - y <= 5) ok = true;
        }
        if (!ok) {
          console.log(`FAIL ${wi + 1}-${li + 1}: plugin at (${x},${y}) unreachable`);
          fail++;
        }
      } else if (ch === '?' || ch === 'I' || ch === 'M' || ch === 'R') {
        blocks++;
        let ok = false;
        for (let cx = Math.max(0, x - 1); cx <= Math.min(W - 1, x + 1) && !ok; cx++) {
          const fy = floorBelow(cx, y);
          if (fy >= 0 && fy - y >= 2 && fy - y <= 5) ok = true;
        }
        if (!ok) {
          console.log(`FAIL ${wi + 1}-${li + 1}: block '${ch}' at (${x},${y}) not bumpable`);
          fail++;
        }
      }
    }
  }
}));

console.log(`${total} plugins + ${blocks} blocks, ${fail ? fail + ' unreachable' : 'all reachable'}`);
process.exit(fail ? 1 : 0);
