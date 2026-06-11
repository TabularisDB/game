// Procedural pixel art: every sprite is authored as a char grid and rendered
// to an offscreen canvas at boot. '.' or ' ' = transparent.

import { TILE, WORLDS } from './constants.js';

const COLORS = {
  k: '#0c1322', // outline
  c: '#22d3ee', C: '#0891b2', // cyan
  b: '#3b82f6', d: '#1e40af', // blue
  w: '#ffffff', p: '#0b1020',
  y: '#fde047', Y: '#a5f3fc',
  r: '#ef4444', R: '#991b1b',
  m: '#a78bfa', M: '#6d28d9',
  a: '#f59e0b', A: '#b45309',
  g: '#34d399', G: '#065f46',
  s: '#94a3b8', S: '#475569',
  n: '#16202e', N: '#1f2937',
  o: '#fb923c',
};

function render(rows, w = 16, h = 16, overrides = {}) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  rows.forEach((row, y) => {
    for (let x = 0; x < Math.min(row.length, w); x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      ctx.fillStyle = overrides[ch] || COLORS[ch] || '#f0f';
      ctx.fillRect(x, y, 1, 1);
    }
  });
  return cv;
}

// ---------------------------------------------------------------- player ---
const P_BODY = [
  '................',
  '..kkkkkkkkkkkk..',
  '..kYYcccccccck..',
  '..kcccccccccck..',
  '..kbbbbbbbbbbk..',
  '..kbwwbbbbwwbk..',
  '..kbwpbbbbpwbk..',
  '..kbbbbbbbbbbk..',
  '..kbbbbppbbbbk..',
  '..kdbbbbbbbbdk..',
  '..kddddddddddk..',
  '..kkkkkkkkkkkk..',
];
const P_FEET = {
  idle:  ['...kSSk..kSSk...', '...kSSk..kSSk...'],
  run1:  ['..kSSk....kSSk..', '.kSSk......kSSk.'],
  run2:  ['....kSSkkSSk....', '....kSSkkSSk....'],
  jump:  ['....kSSSSSSk....', '................'],
};
function playerFrame(feet) {
  return render([...P_BODY, ...P_FEET[feet], '..', '..']);
}

// --------------------------------------------------------------- enemies ---
const BLOB_1 = [
  '................',
  '................',
  '................',
  '....kkkkkkkk....',
  '...krrrrrrrrk...',
  '..krrcrrrrrcrk..',
  '.krrrrrrrrrrrrk.',
  '.krwwprrrrpwwrk.',
  '.krwwprrrrpwwrk.',
  '.krrrrrrrrrrrrk.',
  '.krrRRrrrrRRrrk.',
  '.krrrrrcrrrrrrk.',
  '..kRRRRRRRRRRk..',
  '...kkkkkkkkkk...',
  '................',
  '................',
];
const BLOB_2 = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '....kkkkkkkk....',
  '...krrcrrrrrk...',
  '..krrrrrrrrrrk..',
  '.krwwprrrrpwwrk.',
  '.krwwprrrrpwwrk.',
  'krrrrrrrrrrrrrrk',
  'krrRRrrcrrRRrrrk',
  'kRRRRRRRRRRRRRRk',
  '.kkkkkkkkkkkkkk.',
  '................',
  '................',
];
const SNAIL_1 = [
  '................',
  '................',
  '................',
  '................',
  '.......kkkkk....',
  '......kaaaaak...',
  '.....kaAAAaaak..',
  '.kk..kaAkkAaak..',
  'kwpk.kaAkAAaak..',
  'kaakkkaaAAaaak..',
  'kaaaakaaaaaak...',
  'kaaaaaakkkkk....',
  'kaaaaaaaaaaak...',
  '.kkkkkkkkkkkk...',
  '................',
  '................',
];
const SNAIL_2 = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '.......kkkkk....',
  '......kaaaaak...',
  '.kk..kaAAAaaak..',
  'kwpk.kaAkkAaak..',
  'kaakkkaAkAAaak..',
  'kaaaakaaAAaaak..',
  'kaaaaaakaaaak...',
  'kaaaaaaaakkk....',
  '.kkkkkkkkkkkk...',
  '................',
  '................',
];
const WISP_1 = [
  '................',
  '................',
  '.....kkkkkk.....',
  '....kmmmmmmk....',
  '...kmmmmmmmmk...',
  '..kmmwwmmwwmmk..',
  '..kmmwpmmwpmmk..',
  '..kmmmmmmmmmmk..',
  '..kmmMMMMMMmmk..',
  '..kmmmmmmmmmmk..',
  '..kmmmmmmmmmmk..',
  '...km.kmmk.mk...',
  '....k..kk..k....',
  '................',
  '................',
  '................',
];
const WISP_2 = [
  '................',
  '................',
  '.....kkkkkk.....',
  '....kmmmmmmk....',
  '...kmmmmmmmmk...',
  '..kmmwwmmwwmmk..',
  '..kmmwpmmwpmmk..',
  '..kmmmmmmmmmmk..',
  '..kmmMMMMMMmmk..',
  '..kmmmmmmmmmmk..',
  '..kmmmmmmmmmmk..',
  '...k.mmk.kmm....',
  '....k..k..k.....',
  '................',
  '................',
  '................',
];
const DRONE_1 = [
  '.kkkk......kkkk.',
  '....k......k....',
  '...kkkkkkkkkk...',
  '..kcccccccccck..',
  '..kcwpccccwpck..',
  '..kccCCCCCCcck..',
  '...kkkkkkkkkk...',
  '.....k....k.....',
  '................',
];
const DRONE_2 = [
  '..k.kk....kk.k..',
  '....k......k....',
  '...kkkkkkkkkk...',
  '..kcccccccccck..',
  '..kcwpccccwpck..',
  '..kccCCCCCCcck..',
  '...kkkkkkkkkk...',
  '.....k....k.....',
  '................',
];
const DAEMON_1 = [
  '..kk........kk..',
  '.kaak..kk..kaak.',
  '.kaaak.kk.kaaak.',
  '..kaakkkkkkaak..',
  '...kaaaaaaaak...',
  '..kawpaaaawpak..',
  '..kaaaaaaaaaak..',
  '..kaaAAaaAAaak..',
  '...kaaaaaaaak...',
  '....kkkkkkkk....',
];
const DAEMON_2 = [
  '.......kk.......',
  '.......kk.......',
  '...kkkkkkkkkk...',
  '..kaaaaaaaaaak..',
  '.kaakaaaaaakaak.',
  '.kaawpaaaawpaak.',
  '..kkaaaaaaaakk..',
  '...kaaAAaaAAk...',
  '...kaaaaaaaak...',
  '....kkkkkkkk....',
];
const LOCK = (X, Xd) => [
  '................',
  '.....kkkkkk.....',
  '....kssssssk....',
  '....ks....sk....',
  '....ks....sk....',
  '....ks....sk....',
  '..kkkkkkkkkkkk..',
  `..kXXXXXXXXXXk..`,
  `..kXXXXkkXXXXk..`,
  `..kXXXXkkXXXXk..`,
  `..kXXXXXkXXXXk..`,
  `..kXXXXXXXXXXk..`,
  `..kDDDDDDDDDDk..`,
  '..kkkkkkkkkkkk..',
  '................',
  '................',
].map(r => r.replace(/X/g, X).replace(/D/g, Xd));

const BOSS = [
  '..k...k..k...k..',
  '.kXk.kXkkXk.kXk.',
  '.kXXkkXXXXkkXXk.',
  'kXXXXXXXXXXXXXXk',
  'kXXXXXXXXXXXXXXk',
  'kXwwwpXXXXpwwwXk',
  'kXwwwpXXXXpwwwXk',
  'kXXXXXXXXXXXXXXk',
  'kXXXXXXXXXXXXXXk',
  'kXXkXXkXXkXXkXXk',
  'kXXXkXXkkXXkXXXk',
  'kXXXXXXXXXXXXXXk',
  'kDXXXXXXXXXXXXDk',
  'kDDXXXXXXXXXXDDk',
  '.kDDDDDDDDDDDDk.',
  '..kkkkkkkkkkkk..',
];
function bossSprite(color) {
  const map = { amber: ['a', 'A'], violet: ['m', 'M'], red: ['r', 'R'] }[color];
  return render(BOSS.map(r => r.replace(/X/g, map[0]).replace(/D/g, map[1])));
}

// ----------------------------------------------------------------- items ---
const COIN = [
  '..kkkkkkkk..',
  '.kcccccccck.',
  '.kcYYYYYYck.',
  '.kcccccccck.',
  '.kcYYYYYYck.',
  '.kcccccccck.',
  '.kcYYYYYYck.',
  '.kcccccccck.',
  '..kkkkkkkk..',
];
const INDEX_ITEM = [
  '................',
  '......kkkk......',
  '.....kyyyk......',
  '....kyyyk.......',
  '...kyyyk........',
  '..kyyyyykkkk....',
  '...kkkyyyyk.....',
  '.....kyyyk......',
  '....kyyyk.......',
  '...kyyyk........',
  '...kyyk.........',
  '...kyk..........',
  '...kk...........',
  '................',
  '................',
  '................',
];
const MCP_ITEM = [
  '................',
  '.......kk.......',
  '......kmmk......',
  '.....kmmmmk.....',
  '....kmmYYmmk....',
  '...kmmYwwYmmk...',
  '...kmmYwwYmmk...',
  '....kmmYYmmk....',
  '.....kmmmmk.....',
  '......kmmk......',
  '.......kk.......',
  '................',
  '................',
  '................',
  '................',
  '................',
];
const SCALE_ITEM = [
  '................',
  '................',
  '...kkkkkkkkkkk..',
  '..kggggggggggk..',
  '..kgkkgkkgkkgk..',
  '..kgkkgkkgkkgk..',
  '..kggggggggggk..',
  '..kgggggggggGk..',
  '..kyykyykyykyk..',
  '..kkkkkkkkkkkk..',
  '................',
];
const PLUGIN = [
  '...kk...kk....',
  '...kYk..kYk...',
  '..kkkkkkkkkk..',
  '..kmmmmmmmmk..',
  '..kmmYYYmmmk..',
  '..kmmYYYmmmk..',
  '..kmmmmmmmmk..',
  '...kmmmmmmk...',
  '....kkkkkk....',
];
const QBLOCK = [
  'kkkkkkkkkkkkkkkk',
  'kbnnnnnnnnnnnnbk',
  'knnnnnwwwwnnnnnk',
  'knnnnwwnnwwnnnnk',
  'knnnnwwnnwwnnnnk',
  'knnnnnnnwwnnnnnk',
  'knnnnnnwwnnnnnnk',
  'knnnnnnwwnnnnnnk',
  'knnnnnnnnnnnnnnk',
  'knnnnnnwwnnnnnnk',
  'knnnnnnwwnnnnnnk',
  'knnnnnnnnnnnnnnk',
  'kbnnnnnnnnnnnnbk',
  'kkkkkkkkkkkkkkkk',
  '................',
  '................',
];
const USED_BLOCK = [
  'kkkkkkkkkkkkkkkk',
  'kSNNNNNNNNNNNNSk',
  'kNNNNNNNNNNNNNNk',
  'kNNNNNNNNNNNNNNk',
  'kNNNNNNNNNNNNNNk',
  'kNNNNNNNNNNNNNNk',
  'kNNNNNNNNNNNNNNk',
  'kNNNNNNNNNNNNNNk',
  'kNNNNNNNNNNNNNNk',
  'kNNNNNNNNNNNNNNk',
  'kNNNNNNNNNNNNNNk',
  'kNNNNNNNNNNNNNNk',
  'kSNNNNNNNNNNNNSk',
  'kkkkkkkkkkkkkkkk',
  '................',
  '................',
];
const FLAGPOLE = [
  '.......ss.......',
  '.......ssgggggg.',
  '.......ssgwwggg.',
  '.......ssgwggggg',
  '.......ssgggggg.',
  '.......ssggggg..',
  '.......ss.......',
  '.......ss.......',
  '.......ss.......',
  '.......ss.......',
  '.......ss.......',
  '.......ss.......',
  '.......ss.......',
  '.......ss.......',
  '......ssss......',
  '.....ssssss.....',
];
const CHECKPOINT = [
  '.......ss.......',
  '.......ssgggg...',
  '.......ssgGGg...',
  '.......ssgggg...',
  '.......ss.......',
  '.......ss.......',
  '.......ss.......',
  '.......ss.......',
  '.......ss.......',
  '.......ss.......',
  '.......ss.......',
  '.......ss.......',
  '.......ss.......',
  '.......ss.......',
  '......ssss......',
  '.....ssssss.....',
];
const BOLT = [
  '............',
  '..kkkk......',
  '.kccYYkk....',
  'kcYYYYYYk...',
  '.kccYYkk....',
  '..kkkk......',
];
const ORB = [
  '...kkkk...',
  '..krrrrk..',
  '.krRrrRrk.',
  '.krrrrrrk.',
  '.krRrrRrk.',
  '..krrrrk..',
  '...kkkk...',
];

// ----------------------------------------------------------------- tiles ---
function groundTile(world) {
  const cv = document.createElement('canvas');
  cv.width = TILE; cv.height = TILE;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = world.ground;
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = world.groundTop;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(0, 0, 16, 2);
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = world.accent;
  ctx.fillRect(0, 0, 1, 16);
  ctx.fillRect(15, 0, 1, 16);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 15, 16, 1);
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = world.accent;
  ctx.fillRect(4, 6, 2, 2); ctx.fillRect(10, 10, 2, 2);
  return cv;
}
function brickTile(world) {
  const cv = document.createElement('canvas');
  cv.width = TILE; cv.height = TILE;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#161b27';
  ctx.fillRect(0, 0, 16, 16);
  ctx.strokeStyle = world.accent;
  ctx.globalAlpha = 0.45;
  ctx.strokeRect(0.5, 0.5, 15, 15);
  ctx.globalAlpha = 0.3;
  // table-row stripes
  ctx.fillStyle = world.accent;
  ctx.fillRect(3, 4, 10, 1);
  ctx.fillRect(3, 8, 10, 1);
  ctx.fillRect(3, 12, 10, 1);
  return cv;
}
function spikeTile() {
  const cv = document.createElement('canvas');
  cv.width = TILE; cv.height = TILE;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#ef4444';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 4, 16);
    ctx.lineTo(i * 4 + 2, 7);
    ctx.lineTo(i * 4 + 4, 16);
    ctx.fill();
  }
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(0, 14, 16, 2);
  return cv;
}
function platformTile(world) {
  const cv = document.createElement('canvas');
  cv.width = TILE; cv.height = TILE;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = world.accent;
  ctx.fillRect(0, 0, 16, 2);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, 2, 16, 3);
  ctx.fillStyle = '#0f1520';
  ctx.fillRect(1, 5, 2, 2); ctx.fillRect(13, 5, 2, 2);
  return cv;
}
function tunnelTop() {
  const cv = document.createElement('canvas');
  cv.width = TILE; cv.height = TILE;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#0c1f17';
  ctx.fillRect(0, 2, 16, 14);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(0, 0, 16, 3);
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = '#34d399';
  ctx.strokeRect(0.5, 2.5, 15, 13);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#34d399';
  // ">_" terminal prompt
  ctx.fillRect(4, 7, 1, 1); ctx.fillRect(5, 8, 1, 1); ctx.fillRect(4, 9, 1, 1);
  ctx.fillRect(8, 10, 4, 1);
  return cv;
}
function tunnelBody() {
  const cv = document.createElement('canvas');
  cv.width = TILE; cv.height = TILE;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#0c1f17';
  ctx.fillRect(1, 0, 14, 16);
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#34d399';
  ctx.beginPath();
  ctx.moveTo(1.5, 0); ctx.lineTo(1.5, 16);
  ctx.moveTo(14.5, 0); ctx.lineTo(14.5, 16);
  ctx.stroke();
  return cv;
}

// ----------------------------------------------------------------- build ---
export function buildSprites() {
  const S = {
    player: {
      idle: playerFrame('idle'),
      run1: playerFrame('run1'),
      run2: playerFrame('run2'),
      jump: playerFrame('jump'),
    },
    blob: [render(BLOB_1), render(BLOB_2)],
    snail: [render(SNAIL_1), render(SNAIL_2)],
    wisp: [render(WISP_1), render(WISP_2)],
    drone: [render(DRONE_1), render(DRONE_2)],
    daemon: [render(DAEMON_1), render(DAEMON_2)],
    lockClosed: render(LOCK('r', 'R')),
    lockOpen: render(LOCK('g', 'G')),
    boss: {
      amber: bossSprite('amber'),
      violet: bossSprite('violet'),
      red: bossSprite('red'),
    },
    coin: render(COIN, 12, 12),
    plugin: render(PLUGIN, 14, 9),
    scaleItem: render(SCALE_ITEM),
    indexItem: render(INDEX_ITEM),
    mcpItem: render(MCP_ITEM),
    qblock: render(QBLOCK),
    usedBlock: render(USED_BLOCK),
    flag: render(FLAGPOLE),
    checkpoint: render(CHECKPOINT),
    checkpointOn: render(CHECKPOINT.map(r => r.replace(/g/g, 'c').replace(/G/g, 'w'))),
    bolt: render(BOLT, 12, 6),
    orb: render(ORB, 10, 7),
    spike: spikeTile(),
    tunnelTop: tunnelTop(),
    tunnelBody: tunnelBody(),
    tiles: WORLDS.map(w => ({
      ground: groundTile(w),
      brick: brickTile(w),
      platform: platformTile(w),
    })),
  };
  return S;
}

// Big animated logo cube for the title screen (drawn, not a sprite grid).
export function drawLogoCube(ctx, cx, cy, size, t) {
  const bob = Math.sin(t / 40) * 4;
  cy += bob;
  const h = size * 0.5;
  ctx.save();
  // top face
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.moveTo(cx, cy - h);
  ctx.lineTo(cx + size * 0.85, cy - h * 0.5);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx - size * 0.85, cy - h * 0.5);
  ctx.closePath(); ctx.fill();
  // left face
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.85, cy - h * 0.5);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx, cy + h);
  ctx.lineTo(cx - size * 0.85, cy + h * 0.5);
  ctx.closePath(); ctx.fill();
  // right face
  ctx.fillStyle = '#6d28d9';
  ctx.beginPath();
  ctx.moveTo(cx + size * 0.85, cy - h * 0.5);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx, cy + h);
  ctx.lineTo(cx + size * 0.85, cy + h * 0.5);
  ctx.closePath(); ctx.fill();
  // layer lines on faces (the "tables")
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  for (let i = 1; i < 3; i++) {
    const yy = cy + (h * i) / 3;
    ctx.moveTo(cx - size * 0.85, yy - h * 0.5);
    ctx.lineTo(cx, yy);
    ctx.lineTo(cx + size * 0.85, yy - h * 0.5);
  }
  ctx.stroke();
  ctx.restore();
}
