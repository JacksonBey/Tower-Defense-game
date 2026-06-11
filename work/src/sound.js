// Reference: SYSTEM.md#Audio-System
const NOTES = {
  place: [180, 250],
  upgrade: [330, 495, 660],
  wave: [90, 120, 150],
  spawn: [140],
  shoot: [520],
  defeat: [780, 390],
  escape: [110, 70],
  waveClear: [440, 660],
  won: [330, 495, 660, 990],
  lost: [160, 100, 60],
  sell: [280, 190]
};

export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.lastShot = 0;
  }

  async enable() {
    if (!this.ctx) this.ctx = new AudioContext();
    await this.ctx.resume();
    this.enabled = true;
    this.play("upgrade", 0.45);
  }

  toggle() {
    if (this.enabled) {
      this.enabled = false;
      return false;
    }
    this.enable();
    return true;
  }

  play(type, gain = 0.22) {
    if (!this.enabled || !this.ctx) return;
    if (type === "shoot") {
      const now = performance.now();
      if (now - this.lastShot < 95) return;
      this.lastShot = now;
    }
    const notes = NOTES[type] ?? [220];
    notes.forEach((freq, index) => this.tone(freq, index * 0.045, gain, type));
  }

  tone(freq, delay, gain, type) {
    const start = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = type === "shoot" ? "square" : "sawtooth";
    osc.frequency.setValueAtTime(freq, start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(type === "lost" ? 500 : 1400, start);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
    osc.connect(filter).connect(amp).connect(this.ctx.destination);
    osc.start(start);
    osc.stop(start + 0.18);
  }
}
