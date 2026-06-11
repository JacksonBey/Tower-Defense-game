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
  won: "system",
  click: "build",
  error: "build"
};

export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.lastShot = 0;
    this.noiseBuffer = null;

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

  createNoiseBuffer() {
    if (!this.ctx || typeof this.ctx.createBuffer !== "function") return null;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
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
    if (!this.noiseBuffer) {
      this.noiseBuffer = this.createNoiseBuffer();
    }
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

  speak(text) {
    if (!this.enabled || typeof window === "undefined" || !window.speechSynthesis) return;

    try {
      // Cancel active speech to prevent backlog overlapping
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();

      // Attempt to load a deep English voice
      const voice = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") || v.name.includes("Microsoft") || v.name.includes("Natural"))
      ) ?? voices.find((v) => v.lang.startsWith("en"));

      if (voice) {
        utterance.voice = voice;
      }

      utterance.pitch = 0.8; // Lower/deeper pitch
      utterance.rate = 0.85; // Slower cadence for cinematic effect

      const masterVol = this.volumes.master ?? 0.7;
      const systemVol = this.volumes.system ?? 0.7;
      utterance.volume = masterVol * systemVol * 0.8;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error", e);
    }
  }

  playNoise(duration, gain, filterType = "lowpass", filterFreq = 1000, finalFreq = 100) {
    if (!this.enabled || !this.ctx || !this.noiseBuffer) return;
    const start = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const amp = this.ctx.createGain();
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, start);
    if (finalFreq !== filterFreq) {
      filter.frequency.exponentialRampToValueAtTime(finalFreq, start + duration);
    }

    source.connect(filter).connect(amp).connect(this.ctx.destination);
    source.start(start);
    source.stop(start + duration);
  }

  toneSweep(startFreq, endFreq, duration, gain, type = "sine", delay = 0) {
    if (!this.enabled || !this.ctx) return;
    const start = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, start);
    osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);

    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(amp).connect(this.ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  playShoot(towerType, finalGain) {
    if (towerType === "punch") {
      // Stoneguard Post boulder impact
      this.playNoise(0.2, finalGain * 0.7, "lowpass", 300, 80);
      this.toneSweep(150, 50, 0.15, finalGain, "sine");
    } else if (towerType === "radio") {
      // Arcane Spire spell cast sweep
      this.toneSweep(300, 900, 0.12, finalGain * 0.5, "triangle");
      this.toneSweep(600, 1200, 0.12, finalGain * 0.3, "sine", 0.03);
    } else if (towerType === "tax") {
      // Bounty Ballista bow snap/pluck
      this.playNoise(0.04, finalGain * 0.4, "bandpass", 1000, 1000);
      this.toneSweep(600, 150, 0.08, finalGain * 0.8, "triangle");
    } else if (towerType === "freezer") {
      // Frost Obelisk cold whoosh blast
      this.playNoise(0.25, finalGain * 0.8, "bandpass", 1500, 500);
    }
  }

  playDefeat(creepType, finalGain) {
    if (creepType === "chip" || creepType === "glass") {
      // Light creep pop/squish
      this.toneSweep(300, 700, 0.06, finalGain, "triangle");
    } else if (creepType === "bolt") {
      // Medium creep defeat splash
      this.playNoise(0.12, finalGain * 0.7, "lowpass", 600, 100);
      this.toneSweep(220, 80, 0.12, finalGain * 0.5, "sawtooth");
    } else if (creepType === "vault") {
      // Heavy/Elite Stoneback rock-shattering crash
      this.playNoise(0.4, finalGain * 1.1, "lowpass", 800, 50);
      this.toneSweep(120, 40, 0.35, finalGain * 0.9, "sine");
      this.toneSweep(80, 30, 0.35, finalGain * 0.7, "triangle", 0.05);
    } else if (creepType === "static") {
      // Shielded Hex Acolyte crystal bubble pop/shatter
      this.playNoise(0.18, finalGain * 0.9, "highpass", 3500, 1200);
      this.toneSweep(1000, 500, 0.15, finalGain * 0.4, "sine");
    }
  }

  playUI(actionType, finalGain) {
    if (actionType === "place") {
      // Stone locking-in place
      this.playNoise(0.12, finalGain * 0.6, "lowpass", 450, 120);
      this.toneSweep(180, 70, 0.12, finalGain * 0.8, "triangle");
    } else if (actionType === "upgrade") {
      // Arpeggio up
      const base = 261.63; // C4
      this.toneSweep(base, base * 1.25, 0.08, finalGain * 0.4, "sine");
      this.toneSweep(base * 1.25, base * 1.5, 0.08, finalGain * 0.4, "sine", 0.08);
      this.toneSweep(base * 1.5, base * 2.0, 0.15, finalGain * 0.5, "sine", 0.16);
    } else if (actionType === "sell") {
      // Gold salvaging chime
      this.toneSweep(988, 1318, 0.06, finalGain * 0.4, "sine");
      this.toneSweep(1318, 1568, 0.08, finalGain * 0.4, "sine", 0.05);
      this.playNoise(0.1, finalGain * 0.3, "highpass", 2000, 5000);
    } else if (actionType === "wave") {
      // Deep war horn
      this.toneSweep(147, 147, 0.4, finalGain * 0.6, "sawtooth");
      this.toneSweep(110, 110, 0.4, finalGain * 0.7, "sawtooth", 0.05);
    } else if (actionType === "click") {
      // Speed toggle click
      this.toneSweep(600, 600, 0.03, finalGain * 0.5, "triangle");
    } else if (actionType === "error") {
      // Double error buzz
      this.toneSweep(130, 130, 0.08, finalGain * 0.7, "sawtooth");
      this.toneSweep(130, 130, 0.08, finalGain * 0.7, "sawtooth", 0.10);
    }
  }

  play(type, gainMultiplier = 1.0, details = null) {
    if (!this.enabled || !this.ctx) return;
    if (type === "shoot") {
      const now = performance.now();
      if (now - this.lastShot < 95) return;
      this.lastShot = now;
    }

    const channel = CHANNEL_MAP[type] ?? "system";
    const channelVol = this.volumes[channel] ?? 0.7;
    const masterVol = this.volumes.master ?? 0.7;

    const finalGain = channelVol * masterVol * gainMultiplier;
    if (finalGain <= 0.001) return; // Silent

    if (type === "shoot" && details) {
      this.playShoot(details, finalGain);
    } else if (type === "defeat" && details) {
      this.playDefeat(details, finalGain);
    } else if (type === "place" || type === "upgrade" || type === "sell" || type === "wave" || type === "click" || type === "error") {
      this.playUI(type, finalGain);
    } else {
      // Fallback notes arpeggio for victory, defeat, escape, waveClear
      const baseGain = type === "defeat" ? 0.15 :
                       type === "escape" ? 0.35 :
                       type === "place" ? 0.35 :
                       type === "upgrade" ? 0.40 :
                       type === "sell" ? 0.30 :
                       type === "wave" ? 0.40 : 0.45;
      const notes = NOTES[type] ?? [220];
      notes.forEach((freq, index) => this.tone(freq, index * 0.045, finalGain * baseGain, type));
    }
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
