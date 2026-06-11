# Tabularis Run

A Super Mario-style browser platformer themed after **Tabularis**
(https://tabularis.dev — open-source AI-native database client,
github.com/TabularisDB/tabularis). The game exists to **drive visibility to
Tabularis**: every change must preserve the marketing hooks (see below).
Live at **https://game.tabularis.dev** (own subdomain, static hosting,
`CNAME` file included for GitHub Pages).

## Hard constraints

- **Vanilla JS + Canvas, zero runtime dependencies.** The source is plain
  ESM and MUST stay runnable without a build (the whole test suite serves it
  raw). Vite is the only dev dependency: `pnpm dev` (dev server),
  `pnpm build` (production bundle in `dist/`), `pnpm preview`. Do not add
  runtime packages or frameworks.
- **No external assets.** All pixel art is procedural (char-grid sprites in
  `js/sprites.js`), all audio is WebAudio chiptune (`js/audio.js`). PNGs in
  the repo (`og.png`, `icon-*.png`) are *generated* from test pages — never
  hand-edit them, regenerate instead.
- **Marketing hooks must survive every change:**
  - CTA links (tabularis.dev with `utm_source=tabularis-run`, GitHub star) on
    title / game-over / victory screens
  - share button → 1200×630 score-card PNG (`js/sharecard.js`) via Web Share
    API, fallback download + caption to clipboard; caption links the game
    (`https://game.tabularis.dev?utm_source=share`)
  - OG/Twitter meta in `index.html` point to `https://game.tabularis.dev/`
  - SQL-flavored copy everywhere: `COMMIT;` flag, `ROLLBACK` on death,
    `BEGIN;` checkpoints, "did you know" product facts on the clear screen
- Game UI text is **English** (including overlays and hints); conversations
  with the maintainer are Italian.
- **Git: never add `Co-Authored-By` or other trailers to commits.** If one
  slips in, rewrite history and `push --force-with-lease`.

## File map

```
index.html        page shell: meta/OG, PWA links, CSS, touch UI, CTA, rotate overlay
vite.config.js    dev server + build config (target es2022, outDir dist)
public/           static assets copied verbatim to dist:
  manifest.json   PWA (display fullscreen, landscape) — iOS fullscreen path
  CNAME           game.tabularis.dev (GitHub Pages)
  og.png          social card → regenerate via test/og.html (1200×630 shot)
  icon-192/512    PWA icons   → regenerate via test/icon.html
.github/workflows/ci.yml  on push to main: validators + smoke bot, then
                  vite build + deploy to GitHub Pages
js/constants.js   palette, physics tuning, URLS, WORLDS, SOLID tile set
js/sprites.js     char-grid pixel art + procedural tiles + drawLogoCube
js/audio.js       sfx + per-world music loops (frame-driven sequencer)
js/input.js       keyboard (multi-action keys) + touch buttons + gamepad polling
js/levels.js      12 levels via grid-builder DSL + validateLevels()
js/entities.js    Player, enemies, Boss, pickups, projectiles, particles
js/game.js        engine: collisions, camera, interactions, background, render
js/main.js        app shell: state machine, screens, HUD, save, share, mobile
js/sharecard.js   score-card renderer (canvas → PNG)
js/analytics.js   opt-in Matomo: consent modal → loads tracker only if a
                  build injected VITE_MATOMO_URL/VITE_MATOMO_SITE_ID
test/             validators (node) + browser harnesses (chromium headless)
```

## Architecture notes

- `main.js` owns meta-state (lives, score, screens, persistence); `game.js`
  owns one loaded level. They talk via the `app` object (`addRows`,
  `addScore`, `setCheckpoint`, `onPlayerDead`, `onLevelClear`).
- Fixed 60fps timestep with an accumulator over `requestAnimationFrame`.
- States: `title → map (SELECT TABLE) → intro → play ⇄ pause → clear → …`,
  plus `gameover` and `victory`. Game over / victory return to the map.
- Save: localStorage key `tabularis-run-v1` →
  `{ v: 2, unlocked: <0..11>, stats: { "world-level": { best: frames, plugins: [bool×3] } } }`.
- Entity activation is by camera proximity (horizontal normally, vertical in
  climb levels).

## Tile legend (levels.js)

```
'#' ground   'B' brick   'b' used block   '=' one-way platform   '^' spikes
'?' coin block   'I' index block   'M' mcp block   'R' vertical-scaling block
'T' ssh tunnel top (warp)  '|' tunnel body   'o' coin   'F' commit flag
'K' BEGIN checkpoint   'S' start   'D' boss spawn   'p' hidden plugin
enemies: 'g' blob  's' slow query  'f' wisp  'v' drone  'w' daemon  'l' lock gate
```

Blocks `?/I/M/R` are **solid** (in `SOLID`) — otherwise head-bumps never fire.
Warps: `T` tiles pair with `level.warps[i]` destinations in scan order.
Boss levels set `{ boss: true }`; the flag stays inactive until the boss dies.
Vertical levels set `{ vertical: true }` (camera, activation, validators and
the smoke bot all branch on it).

## Gameplay numbers (drive all level design)

- Jump: ~4.3 tiles high, ~4.4 tiles of flat-ground horizontal reach.
  **Max pit width 4** (wider needs platforms at the natural landing spot:
  a full-speed jump crosses row-11 height ~3.5 tiles out). **Max step up 4.**
- Vertical climbs: overlapping one-way platform spans, **rise 3, horizontal
  overlap ≥2 columns** — you jump up *through* the span above.
- Lock-gate passages are 1 tile (16px); player hitbox is 13px (15px when
  big) — never make the big hitbox ≥16px.
- Blocks need a standable floor 2–5 rows below them to be bumpable.
- Damage chain: MCP → Index → Big (Vertical Scaling) → death. Stomps judge
  "from above" using previous-frame positions (prevFeet vs prevTop) so
  head-on closure can't read as a side hit. Boss: stomp = 1 hp, MCP bolt = ¼.

## Testing (run after ANY level/engine change)

```bash
pnpm test                         # = the three node validators below
node js/levels.js                 # data sanity (S/F present, warps, row lengths)
node test/validate-geometry.js    # pits/steps; vertical levels: BFS span chain
node test/validate-plugins.js     # plugins AND ?/I/M/R blocks reachable
python3 -m http.server 8123 &     # serves RAW source (works without build); then:
chromium --headless=new --no-sandbox --enable-logging=stderr \
  --virtual-time-budget=200000 http://localhost:8123/test/smoke.html 2>&1 | grep LEVEL
```

CI (`.github/workflows/ci.yml`) runs the same suite on every push to `main`
and fails unless the bot clears 12/12; on success it builds with Vite and
deploys `dist/` to GitHub Pages (repo setting: Pages source = GitHub Actions).

The smoke bot must report **12/12 CLEARED**. It is edge-aware and
coyote-aware on horizontal levels and switches to a span-climbing strategy on
vertical ones; it plays in "ghost mode" (immune to enemies, pits still kill)
so it validates traversability, not combat. Visual checks: screenshot
`test/shot.html?w=&l=&f=` (gameplay), `test/mapshot.html` (level select),
`test/endshot.html?state=gameover|victory&debug` (end screens; `?debug`
exposes `__app` so the harness can jump straight to the state),
`test/sharecard.html`, `test/og.html`, `test/icon.html`. The headless pattern
is `chromium --headless=new --no-sandbox --hide-scrollbars
--virtual-time-budget=N --screenshot=out.png <url>`.

## Input

Keyboard (multi-action keys: ArrowUp = jump+menu-up), touch buttons, and
gamepads via the Gamepad API — `Input.pollGamepad()` is called once per
fixed step; standard mapping (stick/d-pad move, A/Y jump, B/X fire,
Start = confirm+pause — screens check confirm before pause — Select = mute).
The title menu has a CONTROLS screen listing all three schemes.

## Mobile

Touch UI shows on `(pointer: coarse)`; `?touch=1` forces it on desktop
(`body.force-touch`) for headless screenshots. d-pad ◀ ▼ ▶ (▼ = tunnels),
✦ fire, ▲ jump, pause/fullscreen stacked top-right. Canvas is edge-to-edge
(100dvh); first tap auto-requests fullscreen + landscape lock; iOS gets
fullscreen via the PWA manifest (add-to-home-screen). Portrait shows a
rotate-device overlay. Respect `env(safe-area-inset-*)`.

## Deployment

Repo: https://github.com/TabularisDB/game — every push to `main` tests,
builds and deploys to GitHub Pages automatically (set Pages source to
"GitHub Actions" once; DNS: CNAME record `game → tabularisdb.github.io`;
`public/CNAME` pins the domain). If embedded in tabularis-website use an
iframe with `allow="fullscreen"`. After changing share/OG URLs, regenerate
`public/og.png`.

Analytics (opt-in Matomo) is **off unless the build is fed secrets.** The
deploy job passes repo secrets `MATOMO_URL` + `MATOMO_SITE_ID` as
`VITE_MATOMO_URL`/`VITE_MATOMO_SITE_ID`; Vite inlines them into the bundle,
then `js/analytics.js` shows the consent modal and loads the tracker only
after the player clicks Allow. Raw source (no build) has no env → analytics
stays off, so the test suite and `pnpm dev` never tracks. Preview the modal
with `index.html?consent` (force-shows it even with no tracker configured).

## Content registry (keep in sync when adding things)

- 12 levels = 3 worlds (SQLite cyan, MySQL amber, PostgreSQL blue) × (3
  levels + boss). 3-3 "WAL ascent" is the vertical climb. Bosses: TABLE LOCK
  (3 hp), REPLICATION LAG (4), THE DEADLOCK (5) — W2+ throw orbs.
- 27 hidden plugins (3 per regular level) — `TOTAL_PLUGINS` in main.js.
- 35 bump blocks; one 'R' (Vertical Scaling RAM stick) per regular level.
- `FACTS` array in main.js: real product facts shown on clear screens.
- Background ambience lives in `Game.drawBackground`: parallax datacenter
  (rack skyline + LEDs, patrol drones, data conduits, motes; vertical levels
  get full-height server columns + riser cables). Keep alphas low —
  readability beats decoration.
