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

const CHANNEL_MAP = {
  shoot: "combat",
  spawn: "combat",
  defeat: "combat",
  escape: "combat",
  place: "build",
  upgrade: "build",
  sell: "build",
  wave: "build",
  lost: "system",
  waveClear: "system",
  won: "system"
};

export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.lastShot = 0;

    const hasLocalStorage = typeof localStorage !== "undefined";
    this.enabled = hasLocalStorage ? localStorage.getItem("runehold-sound-enabled") === "true" : false;

    // Load channel volumes or default to 0.7
    this.volumes = {
      master: this.loadVolume("master", 0.7),
      combat: this.loadVolume("combat", 0.7),
      build: this.loadVolume("build", 0.7),
      system: this.loadVolume("system", 0.7)
    };
  }

  loadVolume(channel, defaultValue) {
    if (typeof localStorage === "undefined") return defaultValue;
    const val = localStorage.getItem(`runehold-volume-${channel}`);
    return val !== null ? Number(val) : defaultValue;
  }

  async enable(playSound = true) {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch (e) {
        console.warn("Failed to initialize AudioContext", e);
        return;
      }
    }
    await this.ctx.resume();
    this.enabled = true;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("runehold-sound-enabled", "true");
    }
    if (playSound) {
      this.play("upgrade", 1.0);
    }
  }

  disable() {
    this.enabled = false;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("runehold-sound-enabled", "false");
    }
  }

  toggle() {
    if (this.enabled) {
      this.disable();
      return false;
    } else {
      this.enable(true);
      return true;
    }
  }

  setVolume(channel, value) {
    if (this.volumes[channel] !== undefined) {
      this.volumes[channel] = value;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(`runehold-volume-${channel}`, value.toString());
      }
    }
  }

  play(type, gainMultiplier = 1.0) {
    if (!this.enabled || !this.ctx) return;
    if (type === "shoot") {
      const now = performance.now();
      if (now - this.lastShot < 95) return;
      this.lastShot = now;
    }

    const channel = CHANNEL_MAP[type] ?? "system";
    const channelVol = this.volumes[channel] ?? 0.7;
    const masterVol = this.volumes.master ?? 0.7;

    // Base gains for different sound types to keep the mix pleasant
    const baseGain = type === "shoot" ? 0.08 :
                     type === "spawn" ? 0.06 :
                     type === "defeat" ? 0.15 :
                     type === "escape" ? 0.35 :
                     type === "place" ? 0.35 :
                     type === "upgrade" ? 0.40 :
                     type === "sell" ? 0.30 :
                     type === "wave" ? 0.40 : 0.45;

    const finalGain = baseGain * channelVol * masterVol * gainMultiplier;
    if (finalGain <= 0.001) return; // Silent

    const notes = NOTES[type] ?? [220];
    notes.forEach((freq, index) => this.tone(freq, index * 0.045, finalGain, type));
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
