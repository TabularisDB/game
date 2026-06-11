// Analytic traversability checks: every pit must be jumpable (≤4 tiles) or
// bridged by platforms; no upward step taller than the jump height (4 tiles).
// Lock-gate columns are passable at ground level when open, one-way platforms
// can be walked under, and boss-arena boundary walls are intentional — all
// excluded from the step check.
// Run: node test/validate-geometry.js

import { LEVELS } from '../js/levels.js';

const SOLID = new Set(['#', 'B', 'b', '|', 'T']);
let fail = 0;

// Vertical levels: BFS over platform spans — from the ground you must reach
// the flag span via hops of ≤4 rows with ≥1 column of horizontal overlap.
function checkVertical(id, rows) {
  const H = rows.length, W = rows[0].length;
  const spans = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W;) {
      const ch = rows[y][x];
      if (ch === '=' || ch === '#') {
        let x1 = x;
        while (x1 + 1 < W && (rows[y][x1 + 1] === '=' || rows[y][x1 + 1] === '#')) x1++;
        spans.push({ y, x0: x, x1 });
        x = x1 + 1;
      } else x++;
    }
  }
  let fx = -1, fy = -1;
  for (let y = 0; y < H; y++) {
    const i = rows[y].indexOf('F');
    if (i >= 0) { fx = i; fy = y; }
  }
  const bottom = Math.max(...spans.map(s => s.y));
  const reached = new Set(spans.filter(s => s.y === bottom).map(s => spans.indexOf(s)));
  let grew = true;
  while (grew) {
    grew = false;
    spans.forEach((b, bi) => {
      if (reached.has(bi)) return;
      for (const ai of reached) {
        const a = spans[ai];
        const rise = a.y - b.y;
        if (rise >= 1 && rise <= 4 && b.x0 <= a.x1 && b.x1 >= a.x0) {
          reached.add(bi); grew = true; return;
        }
      }
    });
  }
  const flagSpan = spans.findIndex(s => s.y === fy + 1 && s.x0 <= fx && s.x1 >= fx);
  if (flagSpan < 0 || !reached.has(flagSpan)) {
    console.log(`FAIL ${id}: vertical climb does not reach the flag`);
    fail++;
  }
}

LEVELS.forEach((world, wi) => world.forEach((lvl, li) => {
  const d = lvl.gen();
  const rows = d.map;
  const H = rows.length, W = rows[0].length;
  const id = `${wi + 1}-${li + 1}`;
  if (d.vertical) { checkVertical(id, rows); return; }
  const isBonus = H > 16;
  const mainH = 16;

  const colChars = (x, y0, y1) => {
    let s = '';
    for (let y = y0; y <= Math.min(y1, H - 1); y++) s += rows[y][x];
    return s;
  };

  // pit check: topmost support (solid OR platform) per column
  const support = [];
  for (let x = 0; x < W; x++) {
    let top = -1;
    for (let y = 0; y < mainH; y++) {
      const ch = rows[y][x];
      if (SOLID.has(ch) || ch === '=') { top = y; break; }
    }
    support.push(top);
  }
  for (let x = 0; x < W;) {
    if (support[x] !== -1) { x++; continue; }
    let x1 = x;
    while (x1 < W && support[x1] === -1) x1++;
    if (x1 - x > 4) console.log(`FAIL ${id}: pit at x=${x} width=${x1 - x}`), fail++;
    x = x1;
  }

  // step check: walk floor from SOLID tiles only ('=' can be walked under)
  const floor = [];
  for (let x = 0; x < W; x++) {
    let top = -1;
    for (let y = 0; y < mainH; y++) {
      if (SOLID.has(rows[y][x])) { top = y; break; }
    }
    floor.push(top);
  }
  for (let x = 0; x < W - 1; x++) {
    if (floor[x] === -1 || floor[x + 1] === -1) continue;
    const rise = floor[x] - floor[x + 1];
    if (rise <= 4) continue;
    const next = colChars(x + 1, 0, mainH - 1);
    const isLockGate = next.includes('l');           // pass through at ground level
    const isArenaWall = d.boss && (x + 1 >= W - 3 || x + 1 <= 2); // boundary walls
    if (!isLockGate && !isArenaWall) {
      console.log(`FAIL ${id}: step up of ${rise} tiles at x=${x + 1}`), fail++;
    }
  }

  // bonus rooms: continuous floor between the side walls
  if (isBonus) {
    const bFloor = [];
    for (let x = 0; x < W; x++) {
      let top = -1;
      for (let y = 18; y < H; y++) {
        const ch = rows[y][x];
        if (SOLID.has(ch) || ch === '=') { top = y; break; }
      }
      bFloor.push(top);
    }
    const inRoom = bFloor.map(t => t !== -1);
    const first = inRoom.indexOf(true), last = inRoom.lastIndexOf(true);
    for (let x = first; x <= last; x++) {
      if (bFloor[x] === -1) console.log(`FAIL ${id}: hole in bonus room at x=${x}`), fail++;
    }
  }
}));

console.log(fail ? `${fail} geometry problems` : 'geometry OK');
process.exit(fail ? 1 : 0);
