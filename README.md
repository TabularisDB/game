# Tabularis Run

A Super Mario-style browser platformer themed after [Tabularis](https://tabularis.dev),
the open-source AI-native database client. Built as a marketing/visibility side
project: every screen links back to the site and the GitHub repo, the score is
shareable, and the whole game is database lore.

**Zero dependencies, no build step.** Vanilla JS + Canvas, ES modules, procedural
pixel art and procedural chiptune audio (WebAudio). The entire game is this folder.

## Theme → mechanics

| Game element | Tabularis concept |
|---|---|
| 3 worlds | SQLite → MySQL → PostgreSQL |
| Coins | Data rows (`ROWS` counter, 100 rows = +1 connection) |
| `?` blocks | `NULL` cells — bump them to resolve their value |
| Power-up: Vertical Scaling | RAM stick — grow Mario-style, absorb one hit |
| Power-up: Index | Faster run, higher jump |
| Power-up: MCP Agent | Press X to shoot queries |
| Checkpoints | `BEGIN;` — death is a `ROLLBACK` |
| Level end | `COMMIT;` flag |
| Warp pipes | SSH tunnels |
| Enemies | Corrupted blobs, slow queries, NULL wisps, lock gates, drones (vertical patrol), daemons (swoop at you) |
| Bosses | Table Lock, Replication Lag, The Deadlock |
| Hidden collectibles | 27 "plugins" (3 per level) — the plugin system |
| Level select | `SELECT * FROM levels;` — replay for plugins & records |
| Speedrun | Per-level timer with persisted best times (★ NEW RECORD) |
| Vertical level | 3-3 "WAL ascent" — a 64-row climb up one-way platforms |

The COMMIT screen rotates real "did you know" facts about Tabularis features,
and the share button renders a 1200×630 score-card PNG (native share on
mobile, download + caption on desktop) — every loop of the game funnels
attention back to the product.

## Run locally

```bash
pnpm install
pnpm dev        # Vite dev server
pnpm build      # production bundle → dist/
pnpm test       # static validators (levels, geometry, pickups)
```

The source is plain ESM, so any static server also works without a build
(`python3 -m http.server 8123` — this is how the test suite runs).

## Controls

- **←/→** (or A/D) move · **Space/Z/↑** jump · **X** shoot query (with MCP power-up)
- **↓** enter SSH tunnel · **P/ESC** pause · **M** mute
- **Gamepad** (standard mapping): stick/d-pad move, **A/Y** jump, **B/X** shoot,
  **Start** pause/confirm, **Select** mute — see the in-game CONTROLS screen

### Mobile

Touch controls appear automatically on coarse-pointer devices: a ◀ ▼ ▶ d-pad
(▼ enters SSH tunnels), ✦ fire and ▲ jump, plus pause and fullscreen buttons
top-right. The canvas goes edge-to-edge (full height, no chrome) and the
first tap requests fullscreen + landscape lock automatically where the API
allows; on iOS the PWA manifest (`manifest.json` + icons) gives fullscreen
via add-to-home-screen. Portrait shows a rotate-device overlay — the game is
16:9. Safe-area insets are respected on notched phones. Append `?touch=1` to
force the touch UI on desktop for testing.

## Deployment — game.tabularis.dev

Every push to `main` runs the CI workflow (`.github/workflows/ci.yml`):
static validators + the headless smoke bot (must clear 12/12), then a Vite
build deployed to GitHub Pages. One-time setup: repo Settings → Pages →
source "GitHub Actions", and a DNS CNAME record `game → tabularisdb.github.io`
(`public/CNAME` pins the custom domain).

To also embed it inside tabularis-website, use an iframe (note
`allow="fullscreen"` for the mobile fullscreen button):

```html
<iframe src="https://game.tabularis.dev" allow="fullscreen"
        style="aspect-ratio:16/9;width:100%;border:0"></iframe>
```

## Tests

- `node js/levels.js` — level data sanity (start/flag/warp counts, row lengths)
- `node test/validate-geometry.js` — analytic traversability (pit widths, step heights)
- `node test/validate-plugins.js` — every plugin AND every `?`/`I`/`M` block is reachable
- vertical levels: BFS over platform spans proves the climb connects ground → flag
- `test/og.html` — regenerates `public/og.png` (screenshot at 1200×630)
- `test/icon.html` — regenerates the PWA icons (screenshot at 512 / 192)
- `test/mapshot.html` — renders the level-select screen with a seeded save
- `test/smoke.html` — a headless bot plays all 12 levels to the flag:

```bash
chromium --headless=new --no-sandbox --enable-logging=stderr \
  --virtual-time-budget=150000 http://localhost:8123/test/smoke.html 2>&1 | grep LEVEL
```

## Structure

```
index.html        page shell, touch controls, CTA links, OG/social meta
js/constants.js   palette, physics tuning, world definitions
js/sprites.js     procedural pixel art (char-grid sprites, tiles, logo cube)
js/audio.js       WebAudio chiptune sfx + per-world music loops
js/input.js       keyboard + touch
js/levels.js      12 levels via a grid-builder DSL
js/entities.js    player, enemies, bosses, projectiles, particles
js/game.js        engine: collisions, camera, interactions, rendering
js/main.js        state machine, screens, HUD, persistence, share CTA
test/             smoke bot, geometry validator, screenshot helper
```
