// Reference: SYSTEM.md#Audio-System
const NOTES = {
  place: [196, 247],
  upgrade: [392, 523, 784],
  wave: [110, 165, 220],
  spawn: [146],
  shoot: [698],
  defeat: [880, 587],
  escape: [98, 73],
  waveClear: [392, 587, 784],
  won: [392, 523, 659, 988],
  lost: [147, 110, 82],
  sell: [330, 220]
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
    osc.type = type === "shoot" || type === "place" ? "triangle" : "sawtooth";
    osc.frequency.setValueAtTime(freq, start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(type === "lost" ? 420 : 1800, start);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
    osc.connect(filter).connect(amp).connect(this.ctx.destination);
    osc.start(start);
    osc.stop(start + 0.22);
  }
}
