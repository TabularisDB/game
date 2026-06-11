// Keyboard + touch input. `held` is continuous state, `pressed` is edge-triggered
// and cleared by the game loop at the end of each frame.

// A key can emit several actions: ArrowUp both jumps (in game) and moves
// the selection up (in menus).
const KEYMAP = {
  ArrowLeft: ['left'], KeyA: ['left'],
  ArrowRight: ['right'], KeyD: ['right'],
  ArrowDown: ['down'], KeyS: ['down'],
  ArrowUp: ['jump', 'up'], KeyW: ['jump', 'up'],
  Space: ['jump'], KeyZ: ['jump'],
  KeyX: ['fire'], ControlLeft: ['fire'], ControlRight: ['fire'], KeyK: ['fire'],
  Enter: ['start'], KeyP: ['pause'], Escape: ['pause'], KeyM: ['mute'],
};

export class Input {
  constructor() {
    this.held = {};
    this.pressed = {};
    this.anyKey = false;

    addEventListener('keydown', (e) => {
      const actions = KEYMAP[e.code];
      if (actions) {
        for (const a of actions) {
          if (!this.held[a]) this.pressed[a] = true;
          this.held[a] = true;
        }
        e.preventDefault();
      }
      this.anyKey = true;
    });
    addEventListener('keyup', (e) => {
      const actions = KEYMAP[e.code];
      if (actions) for (const a of actions) this.held[a] = false;
    });

    // Touch buttons (present in index.html, shown on coarse pointers)
    for (const [id, action] of [
      ['tb-left', 'left'], ['tb-right', 'right'], ['tb-down', 'down'],
      ['tb-jump', 'jump'], ['tb-fire', 'fire'], ['tb-pause', 'pause'],
    ]) {
      const el = document.getElementById(id);
      if (!el) continue;
      const on = (e) => {
        e.preventDefault();
        if (!this.held[action]) this.pressed[action] = true;
        this.held[action] = true;
        this.anyKey = true;
        // touch jump also acts as "start" on menus
        if (action === 'jump') this.pressed.start = true;
      };
      const off = (e) => { e.preventDefault(); this.held[action] = false; };
      el.addEventListener('touchstart', on, { passive: false });
      el.addEventListener('touchend', off, { passive: false });
      el.addEventListener('touchcancel', off, { passive: false });
      el.addEventListener('pointerdown', on);
      el.addEventListener('pointerup', off);
      el.addEventListener('pointerleave', off);
      el.addEventListener('contextmenu', (e) => e.preventDefault());
    }
  }

  endFrame() {
    this.pressed = {};
    this.anyKey = false;
  }
}
