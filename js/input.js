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

const GP_ACTIONS = ['jump', 'fire', 'start', 'pause', 'mute', 'up', 'down', 'left', 'right'];

export class Input {
  constructor() {
    this.held = {};
    this.pressed = {};
    this.anyKey = false;
    this.gamepadActive = false;
    this.gpPrev = {};

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

  // Gamepad API is poll-based: called once per frame by the main loop.
  // Standard mapping: stick/d-pad move, A/Y jump, B/X fire, Start = confirm
  // and pause (screens check confirm before pause), Select = sound toggle.
  pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = [...pads].find((p) => p && p.connected);
    this.gamepadActive = !!gp;
    const now = {};
    if (gp) {
      const b = (i) => !!gp.buttons[i]?.pressed;
      now.jump = b(0) || b(3);
      now.fire = b(1) || b(2);
      now.start = b(9);
      now.pause = b(9);
      now.mute = b(8);
      now.up = b(12) || gp.axes[1] < -0.5;
      now.down = b(13) || gp.axes[1] > 0.5;
      now.left = b(14) || gp.axes[0] < -0.4;
      now.right = b(15) || gp.axes[0] > 0.4;
    }
    for (const a of GP_ACTIONS) {
      if (now[a] && !this.gpPrev[a]) { this.pressed[a] = true; this.held[a] = true; }
      else if (!now[a] && this.gpPrev[a]) this.held[a] = false;
    }
    this.gpPrev = now;
  }

  endFrame() {
    this.pressed = {};
    this.anyKey = false;
  }
}
