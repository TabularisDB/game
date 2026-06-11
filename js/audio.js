// Procedural chiptune audio: WebAudio oscillators only, no assets.

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// 16-step loops per world (bass, lead). 0 = rest.
const SONGS = [
  { // title — slow, moody
    speed: 14,
    bass: [45, 0, 45, 0, 48, 0, 45, 0, 43, 0, 43, 0, 48, 0, 50, 0],
    lead: [0, 0, 69, 0, 0, 72, 0, 0, 0, 0, 67, 0, 0, 0, 0, 0],
  },
  { // world 1 — bright
    speed: 9,
    bass: [45, 45, 0, 45, 48, 0, 45, 0, 50, 50, 0, 48, 45, 0, 43, 0],
    lead: [69, 0, 72, 0, 76, 0, 72, 0, 74, 0, 72, 0, 69, 0, 64, 0],
  },
  { // world 2 — groovier
    speed: 8,
    bass: [41, 0, 41, 53, 0, 41, 0, 44, 46, 0, 46, 0, 48, 0, 44, 0],
    lead: [65, 0, 68, 0, 70, 72, 0, 68, 0, 65, 0, 63, 65, 0, 0, 0],
  },
  { // world 3 — tense
    speed: 7,
    bass: [40, 40, 0, 40, 46, 0, 40, 0, 39, 39, 0, 39, 45, 0, 47, 0],
    lead: [64, 0, 67, 70, 0, 67, 0, 64, 63, 0, 66, 69, 0, 0, 71, 0],
  },
  { // boss — driving
    speed: 6,
    bass: [38, 38, 38, 0, 41, 0, 38, 0, 38, 38, 38, 0, 44, 0, 43, 0],
    lead: [62, 0, 65, 0, 62, 0, 68, 67, 0, 65, 0, 62, 0, 70, 0, 0],
  },
];

export class AudioSys {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.song = -1;
    this.step = 0;
    this.clock = 0;
  }

  ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.55;
        this.master.connect(this.ctx.destination);
      } catch { /* no audio available */ }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.55;
    return this.muted;
  }

  tone(freq, dur, { type = 'square', vol = 0.12, slide = 0, delay = 0 } = {}) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  noise(dur, { vol = 0.12, delay = 0 } = {}) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    src.buffer = buf;
    g.gain.value = vol;
    src.connect(g); g.connect(this.master);
    src.start(t0);
  }

  // --- sfx ---
  jump()    { this.tone(220, 0.18, { slide: 320, vol: 0.09 }); }
  coin()    { this.tone(1175, 0.06, { vol: 0.08 }); this.tone(1568, 0.16, { vol: 0.08, delay: 0.06 }); }
  stomp()   { this.noise(0.12, { vol: 0.16 }); this.tone(160, 0.1, { slide: -90, vol: 0.1 }); }
  bump()    { this.tone(110, 0.08, { vol: 0.1, type: 'triangle' }); }
  powerup() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, { vol: 0.09, delay: i * 0.07 })); }
  hurt()    { this.tone(330, 0.25, { slide: -200, vol: 0.12, type: 'sawtooth' }); }
  die()     { [392, 330, 262, 196, 147].forEach((f, i) => this.tone(f, 0.16, { vol: 0.1, delay: i * 0.11 })); }
  shoot()   { this.tone(880, 0.08, { slide: 500, vol: 0.06 }); }
  warp()    { this.tone(700, 0.35, { slide: -550, vol: 0.1, type: 'triangle' }); }
  checkpoint() { this.tone(660, 0.1, { vol: 0.09 }); this.tone(880, 0.18, { vol: 0.09, delay: 0.1 }); }
  plugin()  { [880, 1109, 1319, 1760].forEach((f, i) => this.tone(f, 0.1, { vol: 0.08, delay: i * 0.05, type: 'triangle' })); }
  bosshit() { this.noise(0.15, { vol: 0.18 }); this.tone(120, 0.25, { slide: -60, vol: 0.14, type: 'sawtooth' }); }
  explode() { this.noise(0.5, { vol: 0.22 }); this.tone(80, 0.5, { slide: -50, vol: 0.15, type: 'sawtooth' }); }
  oneup()   { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.13, { vol: 0.1, delay: i * 0.08, type: 'triangle' })); }
  commit()  { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.15, { vol: 0.1, delay: i * 0.09 })); }
  gameover(){ [330, 311, 294, 262].forEach((f, i) => this.tone(f, 0.3, { vol: 0.1, delay: i * 0.22, type: 'triangle' })); }

  // --- music ---
  // transpose (semitones) + tempo (×speed) give each level its own variation
  // on the shared world theme without hand-authoring 12 separate loops.
  playSong(i, { transpose = 0, tempo = 1 } = {}) {
    this.song = i; this.step = 0; this.clock = 0;
    this.transpose = transpose; this.tempo = tempo;
  }
  stopSong() { this.song = -1; }

  update() {
    if (this.song < 0 || !this.ctx || this.muted) return;
    const s = SONGS[this.song];
    const speed = Math.max(3, Math.round(s.speed / (this.tempo || 1)));
    if (this.clock++ % speed !== 0) return;
    const i = this.step++ % 16;
    const tr = this.transpose || 0;
    const b = s.bass[i], l = s.lead[i];
    if (b) this.tone(midi(b + tr), 0.12, { type: 'square', vol: 0.035 });
    if (l) this.tone(midi(l + tr), 0.14, { type: 'triangle', vol: 0.045 });
  }
}
