// App shell: state machine (title/map/intro/play/clear/gameover/victory),
// HUD, persistence, and the Tabularis CTAs.

import { VIEW_W, VIEW_H, WORLDS, URLS, SAVE_KEY, PAL } from './constants.js';
import { LEVELS } from './levels.js';
import { buildSprites, drawLogoCube } from './sprites.js';
import { AudioSys } from './audio.js';
import { Input } from './input.js';
import { Game } from './game.js';
import { buildShareCard } from './sharecard.js';

const TOTAL_LEVELS = 12;
const TOTAL_PLUGINS = 27;

// Rotating product facts shown on the COMMIT screen — the visibility hook.
const FACTS = [
  'Tabularis ships a built-in MCP server: AI agents query your DB directly.',
  'Visual EXPLAIN turns query plans into interactive graphs.',
  'SQL Notebooks mix SQL, Markdown and inline charts in one document.',
  'The plugin system speaks JSON-RPC — write plugins in any language.',
  'SSH & Kubernetes tunneling are built in. Like these warp pipes.',
  'Tabularis is open source. Star it: github.com/TabularisDB/tabularis',
  'The Visual Query Builder lets you drag-and-drop JOINs. No typing.',
  'PostgreSQL, MySQL, MariaDB and SQLite — out of the box.',
  '10+ themes included. This game is basically theme #11.',
];

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const cta = document.getElementById('cta');
const shareBtn = document.getElementById('share');

const app = {
  input: new Input(),
  audio: new AudioSys(),
  sprites: buildSprites(),

  state: 'title',
  stateT: 0,
  menuIdx: 0,
  mapIdx: 0,
  pauseIdx: 0,

  world: 0,
  level: 0,
  lives: 3,
  rows: 0,
  score: 0,
  checkpoint: null,
  deathT: -1,
  lastClear: null,

  unlocked: 0,         // highest reachable global level index (0..11)
  stats: {},           // "world-level" → { best: frames, plugins: [bool×3] }

  get gIdx() { return this.world * 4 + this.level; },
  get key() { return `${this.world}-${this.level}`; },

  pluginCount() {
    return Object.values(this.stats).reduce(
      (n, s) => n + (s.plugins || []).filter(Boolean).length, 0);
  },

  addRows(n) {
    this.rows += n;
    if (this.rows % 100 === 0) {
      this.lives++;
      this.audio.oneup();
      game.floatText(game.player.x, game.player.y - 16, '+1 CONNECTION', '#34d399');
    }
  },
  addScore(n) { this.score += n; },
  setCheckpoint(tx, ty) { this.checkpoint = [tx, ty]; },

  onPlayerDead() { this.deathT = 0; },

  onLevelClear() {
    const st = this.stats[this.key] || { plugins: [false, false, false] };
    const newRecord = st.best === undefined || game.frame < st.best;
    st.best = Math.min(st.best ?? 1e9, game.frame);
    for (const i of game.pluginsGot) st.plugins[i] = true;
    this.stats[this.key] = st;
    this.lastClear = { time: game.frame, newRecord };
    this.unlocked = Math.max(this.unlocked, Math.min(TOTAL_LEVELS - 1, this.gIdx + 1));
    this.save();
    this.setState('clear');
  },

  setState(s) {
    this.state = s;
    this.stateT = 0;
    cta.hidden = !(s === 'title' || s === 'gameover' || s === 'victory');
    if (s === 'title' || s === 'map') this.audio.playSong(0);
  },

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 2, unlocked: this.unlocked, stats: this.stats,
      }));
    } catch {}
  },
  load() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!d) return;
      if (d.v === 2) {
        this.unlocked = d.unlocked || 0;
        this.stats = d.stats || {};
      } else if (d.world) {
        this.unlocked = d.world * 4; // legacy format
      }
    } catch {}
  },
};

const game = new Game(app);
app.load();

// ------------------------------------------------------------- mobile ---
const IS_TOUCH = matchMedia('(pointer: coarse)').matches
  || new URLSearchParams(location.search).has('touch');
if (new URLSearchParams(location.search).has('touch')) {
  document.body.classList.add('force-touch');
}

// fullscreen + landscape lock (best effort — iOS Safari has no fullscreen
// API: there the PWA manifest covers it via add-to-home-screen)
async function enterFullscreen() {
  try {
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    await screen.orientation?.lock?.('landscape');
  } catch {}
}
document.getElementById('tb-fs')?.addEventListener('click', async () => {
  if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch {} }
  else enterFullscreen();
});
// on touch devices go fullscreen with the first tap, without further asking
if (IS_TOUCH) {
  addEventListener('pointerdown', () => {
    if (!document.fullscreenElement) enterFullscreen();
  }, { once: true });
}

// tapping the playfield acts as "confirm" on menu screens
canvas.addEventListener('pointerdown', () => {
  if (app.state !== 'play' && app.state !== 'pause') app.input.pressed.start = true;
});

const HINT_MOVE = IS_TOUCH ? '◀ ▶ move · ▲ jump · ✦ query · ▼ ssh tunnel' : '←→ move · SPACE jump · X query · ↓ ssh tunnel · P pause';
const HINT_MENU = IS_TOUCH ? '▼ select · ▲ confirm' : '↑↓ select · ENTER confirm';
const HINT_MAP = IS_TOUCH ? '◀ ▶ choose · ▲ connect' : 'arrows: choose · ENTER: connect · ESC: back';
const HINT_PLAY = IS_TOUCH ? '◀ ▶ move · ▲ jump' : '←→ move · SPACE jump';

// ------------------------------------------------------------- share CTA ---
// Renders a score card image: shared natively where the Web Share API
// supports files, downloaded (with the caption copied) everywhere else.
shareBtn?.addEventListener('click', async () => {
  const url = `${URLS.game}?utm_source=share`;
  const text = `I committed ${app.score} points and salvaged ${app.pluginCount()}/${TOTAL_PLUGINS} plugins in TABULARIS RUN ▦ — the platformer from Tabularis, the open-source AI-native database client.\n${url}`;
  try {
    const card = buildShareCard({
      score: app.score,
      rows: app.rows,
      plugins: app.pluginCount(),
      totalPlugins: TOTAL_PLUGINS,
      unlocked: Math.min(app.unlocked + 1, TOTAL_LEVELS),
      totalLevels: TOTAL_LEVELS,
    }, app.sprites);
    const blob = await new Promise((r) => card.toBlob(r, 'image/png'));
    const file = new File([blob], 'tabularis-run-score.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text });
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'tabularis-run-score.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      try { await navigator.clipboard.writeText(text); } catch {}
      shareBtn.textContent = 'image saved + caption copied!';
      setTimeout(() => (shareBtn.textContent = 'share score card'), 2200);
    }
  } catch {}
});
if (shareBtn) shareBtn.textContent = 'share score card';

// ------------------------------------------------------------ state flow ---
function startSession(globalIdx) {
  app.world = Math.floor(globalIdx / 4);
  app.level = globalIdx % 4;
  app.lives = 3;
  app.rows = 0;
  app.score = 0;
  app.checkpoint = null;
  app.setState('intro');
}

function enterLevel() {
  game.loadLevel(app.world, app.level, app.checkpoint);
  app.deathT = -1;
  app.audio.playSong(game.isBossLevel ? 4 : app.world + 1);
  app.setState('play');
}

function nextLevel() {
  app.checkpoint = null;
  const next = app.gIdx + 1;
  if (next >= TOTAL_LEVELS) {
    app.audio.stopSong();
    app.setState('victory');
    return;
  }
  app.world = Math.floor(next / 4);
  app.level = next % 4;
  if (app.level === 0) app.setState('intro');
  else enterLevel();
}

// ------------------------------------------------------------------ text ---
function text(str, x, y, { size = 8, color = PAL.text, align = 'center', bold = false } = {}) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px "JetBrains Mono", monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function dim(alpha = 0.6) {
  ctx.fillStyle = `rgba(8,9,10,${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function mmss(frames) {
  const s = frames / 60;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function diamonds(x, y, plugins, got = []) {
  for (let i = 0; i < 3; i++) {
    const filled = (plugins && plugins[i]) || got.includes(i);
    ctx.fillStyle = filled ? PAL.violet : '#2a2f3a';
    ctx.save();
    ctx.translate(x + i * 9, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-2.5, -2.5, 5, 5);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- screens ---
function drawTitle(t) {
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = PAL.cyan;
  ctx.beginPath();
  for (let x = 0; x < VIEW_W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, VIEW_H); }
  for (let y = 0; y < VIEW_H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(VIEW_W, y); }
  ctx.stroke();
  ctx.restore();

  drawLogoCube(ctx, VIEW_W / 2, 70, 32, t);

  text('TABULARIS RUN', VIEW_W / 2, 116, { size: 22, color: PAL.bright, bold: true });
  text('a tiny platformer from the team behind the', VIEW_W / 2, 134, { size: 7, color: PAL.muted });
  text('open-source AI-native database client', VIEW_W / 2, 144, { size: 7, color: PAL.cyan });

  const items = [['NEW QUERY', () => startSession(0)]];
  if (app.unlocked > 0) {
    items.push([`SELECT TABLE (${app.unlocked + 1}/${TOTAL_LEVELS} unlocked)`, () => {
      app.mapIdx = Math.min(app.unlocked, TOTAL_LEVELS - 1);
      app.setState('map');
    }]);
  }
  items.push([`SOUND: ${app.audio.muted ? 'OFF' : 'ON'}`, () => app.audio.toggleMute()]);

  items.forEach(([label], i) => {
    const sel = i === app.menuIdx;
    text(`${sel ? '> ' : '  '}${label}${sel ? ' _' : ''}`, VIEW_W / 2, 172 + i * 14, {
      size: 9, color: sel ? PAL.green : PAL.muted, bold: sel,
    });
  });

  const got = app.pluginCount();
  if (got > 0) text(`plugins salvaged: ${got}/${TOTAL_PLUGINS}`, VIEW_W / 2, 220, { size: 7, color: PAL.violet });
  text(HINT_MOVE, VIEW_W / 2, 236, { size: 7, color: PAL.muted });
  text(HINT_MENU, VIEW_W / 2, 248, { size: 7, color: '#4b5563' });

  if (app.menuIdx >= items.length) app.menuIdx = items.length - 1;
  if (app.input.pressed.down) app.menuIdx = (app.menuIdx + 1) % items.length;
  if (app.input.pressed.up) app.menuIdx = (app.menuIdx + items.length - 1) % items.length;
  // ArrowUp also emits "jump": only confirm on a jump that isn't menu-up
  const confirm = app.input.pressed.start || (app.input.pressed.jump && !app.input.pressed.up);
  if (confirm) {
    app.audio.ensure();
    items[app.menuIdx][1]();
  }
}

function drawMap() {
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text('tabularis> SELECT * FROM levels;', VIEW_W / 2, 20, { size: 9, color: PAL.green, bold: true });

  for (let wi = 0; wi < 3; wi++) {
    const world = WORLDS[wi];
    text(world.name, 26, 52 + wi * 64 + 24, { size: 7, color: world.accent, align: 'left', bold: true });
    for (let li = 0; li < 4; li++) {
      const idx = wi * 4 + li;
      const x = 88 + li * 96, y = 44 + wi * 64;
      const w = 88, h = 52;
      const locked = idx > app.unlocked;
      const sel = idx === app.mapIdx;
      const st = app.stats[`${wi}-${li}`];
      const isBoss = li === 3;

      ctx.fillStyle = sel ? '#16181a' : '#101114';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = locked ? '#1a1f29' : sel ? world.accent : PAL.border;
      ctx.lineWidth = sel ? 2 : 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      ctx.lineWidth = 1;

      if (locked) {
        text('····', x + w / 2, y + h / 2, { size: 10, color: '#374151' });
        continue;
      }
      text(`${wi + 1}-${li + 1}`, x + 7, y + 10, { size: 7, color: world.accent, align: 'left', bold: true });
      if (st?.best !== undefined) {
        text(mmss(st.best), x + w - 6, y + 10, { size: 7, color: PAL.muted, align: 'right' });
      }
      const name = LEVELS[wi][li].name.replace('BOSS: ', '');
      text(name.length > 17 ? name.slice(0, 16) + '…' : name, x + w / 2, y + 26, {
        size: 6, color: isBoss ? PAL.red : PAL.text,
      });
      if (!isBoss) diamonds(x + w / 2 - 9, y + 40, st?.plugins);
      else text('☠', x + w / 2, y + 40, { size: 8, color: st?.best !== undefined ? PAL.red : '#374151' });
    }
  }

  text(HINT_MAP, VIEW_W / 2, 258, { size: 7, color: PAL.muted });

  if (app.input.pressed.right && app.mapIdx < app.unlocked) app.mapIdx++;
  if (app.input.pressed.left && app.mapIdx > 0) app.mapIdx--;
  if (app.input.pressed.down) app.mapIdx = Math.min(app.unlocked, app.mapIdx + 4);
  if (app.input.pressed.up && app.mapIdx >= 4) app.mapIdx -= 4;
  if (app.input.pressed.pause) { app.menuIdx = 0; app.setState('title'); return; }
  if (app.input.pressed.start || (app.input.pressed.jump && !app.input.pressed.up)) {
    app.audio.ensure();
    startSession(app.mapIdx);
  }
}

function drawIntro(t) {
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const w = WORLDS[app.world];
  text(`WORLD ${app.world + 1}`, VIEW_W / 2, 96, { size: 10, color: PAL.muted });
  text(w.name, VIEW_W / 2, 122, { size: 26, color: w.accent, bold: true });
  text(w.sub, VIEW_W / 2, 144, { size: 8, color: PAL.muted });
  const dots = '.'.repeat(1 + (Math.floor(t / 20) % 3));
  text(`$ tabularis connect ${w.id}${dots}`, VIEW_W / 2, 180, { size: 8, color: PAL.green });
  text(`CONNECTIONS × ${app.lives}`, VIEW_W / 2, 204, { size: 8, color: PAL.text });
  if (t > 110) enterLevel();
}

function drawHUD() {
  ctx.save();
  ctx.fillStyle = 'rgba(8,9,10,0.7)';
  ctx.fillRect(0, 0, VIEW_W, 13);
  text(`ROWS ${String(app.rows).padStart(4, '0')}`, 6, 7, { size: 7, color: PAL.cyan, align: 'left' });
  text(`SCORE ${String(app.score).padStart(6, '0')}`, 66, 7, { size: 7, color: PAL.text, align: 'left' });
  text(`CONN ×${app.lives}`, 148, 7, { size: 7, color: PAL.green, align: 'left' });
  text(mmss(game.frame), 204, 7, { size: 7, color: PAL.muted, align: 'left' });
  if (game.pluginTotal > 0) {
    diamonds(244, 7, app.stats[app.key]?.plugins, game.pluginsGot);
  }
  const w = WORLDS[app.world];
  text(`${w.id} · ${game.levelName}`, VIEW_W - 6, 7, { size: 7, color: w.accent, align: 'right' });
  ctx.restore();
}

function drawPlay() {
  game.update();
  game.draw(ctx);
  drawHUD();

  if (app.input.pressed.pause) { app.pauseIdx = 0; app.setState('pause'); }
  if (app.input.pressed.mute) app.audio.toggleMute();

  if (app.world === 0 && app.level === 0 && game.frame < 300) {
    ctx.globalAlpha = Math.min(1, (300 - game.frame) / 60);
    text(HINT_PLAY, game.player.x - game.cam.x, 200, { size: 7, color: PAL.muted });
    ctx.globalAlpha = 1;
  }

  if (app.deathT >= 0 && ++app.deathT > 110) {
    app.lives--;
    if (app.lives > 0) enterLevel();
    else { app.audio.stopSong(); app.audio.gameover(); app.setState('gameover'); }
  }
}

function drawPause() {
  game.draw(ctx);
  drawHUD();
  dim(0.65);
  text('-- PAUSED --', VIEW_W / 2, 96, { size: 14, color: PAL.bright, bold: true });
  text('query execution suspended', VIEW_W / 2, 114, { size: 8, color: PAL.muted });

  const items = [
    ['RESUME', () => app.setState('play')],
    ['RESTART LEVEL', () => { app.checkpoint = null; enterLevel(); }],
    ['EXIT TO LEVEL SELECT', () => {
      app.mapIdx = Math.min(app.gIdx, app.unlocked);
      app.setState('map');
    }],
    [`SOUND: ${app.audio.muted ? 'OFF' : 'ON'}`, () => app.audio.toggleMute()],
  ];
  items.forEach(([label], i) => {
    const sel = i === app.pauseIdx;
    text(`${sel ? '> ' : '  '}${label}${sel ? ' _' : ''}`, VIEW_W / 2, 142 + i * 14, {
      size: 9, color: sel ? PAL.green : PAL.muted, bold: sel,
    });
  });
  text(IS_TOUCH ? '▼ select · ▲ confirm · II resume' : '↑↓ select · ENTER confirm · P/ESC resume', VIEW_W / 2, 212, { size: 7, color: '#4b5563' });

  if (app.input.pressed.down) app.pauseIdx = (app.pauseIdx + 1) % items.length;
  if (app.input.pressed.up) app.pauseIdx = (app.pauseIdx + items.length - 1) % items.length;
  if (app.input.pressed.pause) { app.setState('play'); return; }
  if (app.input.pressed.mute) app.audio.toggleMute();
  if (app.input.pressed.start || (app.input.pressed.jump && !app.input.pressed.up)) {
    items[app.pauseIdx][1]();
  }
}

function drawClear(t) {
  game.draw(ctx);
  drawHUD();
  dim(Math.min(0.65, t / 40));
  if (t > 15) {
    text('COMMIT;', VIEW_W / 2, 92, { size: 20, color: PAL.green, bold: true });
    const rec = app.lastClear?.newRecord;
    text(`Query OK (${mmss(game.frame)})${rec ? '  ★ NEW RECORD' : ''}`, VIEW_W / 2, 116, {
      size: 8, color: rec ? PAL.amber : PAL.text,
    });
    if (game.pluginTotal > 0) {
      text('plugins:', VIEW_W / 2 - 26, 134, { size: 7, color: PAL.muted, align: 'right' });
      diamonds(VIEW_W / 2 - 12, 134, app.stats[app.key]?.plugins, game.pluginsGot);
    }
    if (game.isBossLevel) {
      text(`${WORLDS[app.world].boss.name} dropped`, VIEW_W / 2, 134, { size: 8, color: PAL.amber });
    }
  }
  if (t > 55) {
    text('— did you know —', VIEW_W / 2, 170, { size: 7, color: '#4b5563' });
    text(FACTS[app.gIdx % FACTS.length], VIEW_W / 2, 184, { size: 7, color: PAL.cyan });
  }
  if (t > 170) nextLevel();
}

function drawGameOver(t) {
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text('FATAL', VIEW_W / 2, 86, { size: 22, color: PAL.red, bold: true });
  text('connection to server lost', VIEW_W / 2, 108, { size: 9, color: PAL.muted });
  text(`final score ${app.score} · ${app.rows} rows`, VIEW_W / 2, 134, { size: 9, color: PAL.text });
  text('the real Tabularis never drops your connection → tabularis.dev', VIEW_W / 2, 158, { size: 7, color: PAL.cyan });
  if (t > 60 && Math.floor(t / 30) % 2) text('ENTER: reconnect', VIEW_W / 2, 190, { size: 9, color: PAL.green });
  if (t > 60 && (app.input.pressed.start || app.input.pressed.jump)) {
    app.mapIdx = Math.min(app.gIdx, app.unlocked);
    app.setState('map');
  }
}

function drawVictory(t) {
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  for (let i = 0; i < 40; i++) {
    const x = (i * 137 + t * (1 + (i % 3))) % VIEW_W;
    const y = (i * 89 + t * (2 + (i % 2))) % VIEW_H;
    ctx.fillStyle = [PAL.cyan, PAL.blue, PAL.violet, PAL.green][i % 4];
    ctx.fillRect(x, y, 2, 2);
  }
  drawLogoCube(ctx, VIEW_W / 2, 52, 22, t);
  text('ALL DATABASES RESTORED', VIEW_W / 2, 94, { size: 16, color: PAL.green, bold: true });
  text('0 rows corrupted. The Deadlock is no more.', VIEW_W / 2, 113, { size: 8, color: PAL.text });
  text(`SCORE ${app.score} · ROWS ${app.rows} · PLUGINS ${app.pluginCount()}/${TOTAL_PLUGINS}`, VIEW_W / 2, 136, {
    size: 9, color: PAL.cyan, bold: true,
  });
  if (app.pluginCount() < TOTAL_PLUGINS) {
    text('some plugins are still out there — replay levels from SELECT TABLE', VIEW_W / 2, 152, { size: 7, color: PAL.violet });
  }
  text('You beat the game. Now try the real thing:', VIEW_W / 2, 176, { size: 8, color: PAL.muted });
  text('Tabularis — open-source database client for the AI era', VIEW_W / 2, 190, { size: 8, color: PAL.cyan });
  text('github.com/TabularisDB/tabularis ★', VIEW_W / 2, 204, { size: 8, color: PAL.amber });
  if (t > 90 && Math.floor(t / 30) % 2) text('ENTER: level select', VIEW_W / 2, 232, { size: 8, color: PAL.green });
  if (t > 90 && (app.input.pressed.start || app.input.pressed.jump)) {
    app.mapIdx = 0;
    app.setState('map');
  }
}

// ------------------------------------------------------------------- loop ---
const screens = {
  title: drawTitle,
  map: drawMap,
  intro: drawIntro,
  play: drawPlay,
  pause: drawPause,
  clear: drawClear,
  gameover: drawGameOver,
  victory: drawVictory,
};

let last = performance.now();
let acc = 0;
const STEP = 1000 / 60;

function loop(now) {
  acc = Math.min(acc + (now - last), 100);
  last = now;
  while (acc >= STEP) {
    acc -= STEP;
    app.stateT++;
    screens[app.state](app.stateT);
    app.audio.update();
    app.input.endFrame();
  }
  requestAnimationFrame(loop);
}

addEventListener('pointerdown', () => app.audio.ensure(), { once: true });
addEventListener('keydown', () => app.audio.ensure(), { once: true });

app.setState('title');
requestAnimationFrame(loop);
