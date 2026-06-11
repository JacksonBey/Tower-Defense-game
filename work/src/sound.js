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
  error: "build",
  select: "build",
  levelSelect: "system",
  resetLevel: "system"
};

const IDLE_CHORDS = [
  [110.00, 164.81, 246.94, 261.63], // Am9
  [73.42, 185.00, 261.63, 329.63],  // D7
  [87.31, 130.81, 164.81, 220.00],  // Fmaj7
  [98.00, 146.83, 246.94, 293.66]   // G6
];

const ACTIVE_CHORDS = [
  [110.00, 164.81, 220.00, 261.63], // Am
  [87.31, 130.81, 174.61, 220.00],  // F
  [65.41, 196.00, 261.63, 329.63],  // C
  [98.00, 146.83, 196.00, 246.94]   // G
];

export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.lastShot = 0;
    this.noiseBuffer = null;
    this.droneOsc = null;
    this.droneGain = null;
    this.droneActive = false;
    this.lastPreviewPlay = {};
    this.loadedVoices = [];
    this.schedulerId = null;
    this.nextNoteTime = 0;
    this.currentStep = 0;

    const hasLocalStorage = typeof localStorage !== "undefined";
    this.enabled = hasLocalStorage ? localStorage.getItem("runehold-sound-enabled") === "true" : false;

    // Load channel volumes or default to 0.7
    this.volumes = {
      master: this.loadVolume("master", 0.7),
      combat: this.loadVolume("combat", 0.7),
      build: this.loadVolume("build", 0.7),
      system: this.loadVolume("system", 0.7)
    };

    if (typeof window !== "undefined" && window.speechSynthesis) {
      if (typeof window.speechSynthesis.addEventListener === "function") {
        window.speechSynthesis.addEventListener("voiceschanged", () => {
          this.loadedVoices = window.speechSynthesis.getVoices();
        });
      }
      this.loadedVoices = window.speechSynthesis.getVoices();
    }
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
    this.startDrone();
    this.startSequencer();
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("runehold-sound-enabled", "true");
    }
    if (playSound) {
      this.play("upgrade", 1.0);
    }
  }

  disable() {
    this.enabled = false;
    this.stopDrone();
    this.stopSequencer();
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
      if (channel === "master" || channel === "system") {
        this.updateDroneVolume();
      }
      if (this.enabled && this.ctx) {
        this.playPreview(channel);
      }
    }
  }

  speak(text) {
    if (!this.enabled || typeof window === "undefined" || !window.speechSynthesis) return;

    try {
      // Cancel active speech to prevent backlog overlapping
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = this.loadedVoices.length ? this.loadedVoices : window.speechSynthesis.getVoices();

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
    if (!this.enabled || !this.ctx || !this.noiseBuffer || typeof this.ctx.createBufferSource !== "function" || typeof this.ctx.createGain !== "function" || typeof this.ctx.createBiquadFilter !== "function") return;
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
    if (!this.enabled || !this.ctx || typeof this.ctx.createOscillator !== "function" || typeof this.ctx.createGain !== "function") return;
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

  playPlace(towerType, finalGain) {
    if (towerType === "punch") {
      // Stoneguard Post - heavy stone slam
      this.playNoise(0.18, finalGain * 0.9, "lowpass", 300, 50);
      this.toneSweep(140, 40, 0.18, finalGain * 1.2, "sine");
    } else if (towerType === "radio") {
      // Arcane Spire - crystalline magical hum
      this.toneSweep(500, 800, 0.15, finalGain * 0.6, "sine");
      this.toneSweep(700, 1100, 0.15, finalGain * 0.4, "triangle", 0.04);
    } else if (towerType === "tax") {
      // Bounty Ballista - dry wooden snap/click
      this.playNoise(0.06, finalGain * 0.5, "bandpass", 800, 400);
      this.toneSweep(200, 100, 0.08, finalGain * 0.8, "triangle");
    } else if (towerType === "freezer") {
      // Frost Obelisk - cold wind freeze
      this.playNoise(0.25, finalGain * 0.8, "bandpass", 1200, 600);
      this.toneSweep(300, 150, 0.2, finalGain * 0.5, "sine");
    } else {
      this.playUI("place", finalGain);
    }
  }

  playUpgrade(towerType, finalGain) {
    if (towerType === "punch") {
      // Heavy hammer strike
      this.playNoise(0.2, finalGain * 0.8, "lowpass", 600, 150);
      this.toneSweep(300, 80, 0.25, finalGain * 1.0, "sawtooth");
    } else if (towerType === "radio") {
      // Crystalline arpeggio chords
      const base = 392; // G4
      this.toneSweep(base, base * 1.5, 0.1, finalGain * 0.5, "sine");
      this.toneSweep(base * 1.25, base * 1.875, 0.1, finalGain * 0.5, "sine", 0.06);
      this.toneSweep(base * 1.5, base * 2.25, 0.15, finalGain * 0.6, "sine", 0.12);
    } else if (towerType === "tax") {
      // Mechanical winding gears
      this.toneSweep(120, 240, 0.06, finalGain * 0.6, "triangle");
      this.toneSweep(160, 320, 0.06, finalGain * 0.6, "triangle", 0.06);
      this.toneSweep(200, 400, 0.08, finalGain * 0.7, "triangle", 0.12);
    } else if (towerType === "freezer") {
      // Ice crackling wind
      this.playNoise(0.35, finalGain * 0.9, "highpass", 1500, 3000);
      this.toneSweep(600, 300, 0.25, finalGain * 0.6, "sine");
    } else {
      this.playUI("upgrade", finalGain);
    }
  }

  playSpawn(enemyType, finalGain) {
    if (enemyType === "chip" || enemyType === "glass") {
      // Imp chatter / Wisp chime
      this.toneSweep(800, 1500, 0.08, finalGain * 0.5, "sine");
      this.toneSweep(1200, 600, 0.08, finalGain * 0.4, "triangle", 0.04);
    } else if (enemyType === "bolt") {
      // Brute splash/growl
      this.playNoise(0.15, finalGain * 0.6, "lowpass", 400, 80);
      this.toneSweep(180, 90, 0.15, finalGain * 0.8, "sine");
    } else if (enemyType === "vault") {
      // Heavy Stoneback rumble
      this.playNoise(0.35, finalGain * 0.9, "lowpass", 250, 40);
      this.toneSweep(90, 45, 0.3, finalGain * 1.2, "sine");
      this.toneSweep(80, 40, 0.3, finalGain * 0.9, "sine", 0.05);
    } else if (enemyType === "static") {
      // Hex Acolyte bubble hum
      this.toneSweep(400, 300, 0.2, finalGain * 0.6, "triangle");
      this.toneSweep(300, 500, 0.25, finalGain * 0.4, "sine", 0.05);
    } else {
      this.tone(146, 0, finalGain * 0.4, "spawn");
    }
  }

  playSell(towerType, finalGain) {
    // Play gold coins salvage chime first (system UI feel)
    this.toneSweep(988, 1318, 0.06, finalGain * 0.4, "sine");
    this.toneSweep(1318, 1568, 0.08, finalGain * 0.4, "sine", 0.05);
    this.playNoise(0.1, finalGain * 0.3, "highpass", 2000, 5000);
    
    // Play structural deconstruction sound per tower type
    if (towerType === "punch") {
      this.playNoise(0.25, finalGain * 0.6, "lowpass", 300, 50);
    } else if (towerType === "radio") {
      this.playNoise(0.2, finalGain * 0.5, "highpass", 2500, 1000);
      this.toneSweep(1200, 400, 0.15, finalGain * 0.3, "sine");
    } else if (towerType === "tax") {
      this.playNoise(0.15, finalGain * 0.5, "bandpass", 600, 200);
    } else if (towerType === "freezer") {
      this.playNoise(0.22, finalGain * 0.6, "highpass", 1800, 800);
    }
  }

  playSelect(towerType, finalGain) {
    // Play a standard menu click + a quiet preview of the tower's nature
    this.playUI("click", finalGain * 0.7);
    if (towerType === "punch") {
      this.toneSweep(120, 90, 0.1, finalGain * 0.5, "sine");
    } else if (towerType === "radio") {
      this.toneSweep(800, 1200, 0.1, finalGain * 0.3, "sine");
    } else if (towerType === "tax") {
      this.toneSweep(300, 180, 0.08, finalGain * 0.4, "triangle");
    } else if (towerType === "freezer") {
      this.playNoise(0.12, finalGain * 0.4, "bandpass", 1500, 1000);
    }
  }

  playLevelSelect(finalGain) {
    // A beautiful rising sweep arpeggio
    this.toneSweep(330, 440, 0.15, finalGain * 0.5, "sine");
    this.toneSweep(440, 550, 0.15, finalGain * 0.5, "sine", 0.05);
    this.toneSweep(550, 660, 0.2, finalGain * 0.6, "sine", 0.1);
  }

  playResetLevel(finalGain) {
    // A falling sweep representing restart
    this.toneSweep(440, 220, 0.2, finalGain * 0.6, "triangle");
    this.playNoise(0.15, finalGain * 0.4, "lowpass", 400, 100);
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

  playPreview(channel) {
    const now = performance.now();
    if (now - (this.lastPreviewPlay[channel] ?? 0) < 150) return;
    this.lastPreviewPlay[channel] = now;

    const channelVol = this.volumes[channel] ?? 0.7;
    const masterVol = this.volumes.master ?? 0.7;
    const finalGain = channelVol * masterVol;
    if (finalGain <= 0.001) return;

    if (channel === "combat") {
      this.playShoot("radio", finalGain * 0.4);
    } else if (channel === "build") {
      this.playUI("click", finalGain * 0.8);
    } else if (channel === "system") {
      this.toneSweep(440, 440, 0.08, finalGain * 0.3, "sine");
    } else if (channel === "master") {
      this.toneSweep(523.25, 659.25, 0.08, finalGain * 0.3, "sine");
    }
  }
  startSequencer() {
    if (!this.enabled || !this.ctx || typeof this.ctx.createOscillator !== "function" || this.schedulerId) return;
    this.nextNoteTime = this.ctx.currentTime;
    this.currentStep = 0;
    this.schedulerId = setInterval(() => this.schedulerTick(), 50);
  }

  stopSequencer() {
    if (this.schedulerId) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
  }

  schedulerTick() {
    if (!this.ctx || typeof this.ctx.currentTime === "undefined") return;
    const lookahead = 0.12;
    const stepDuration = this.droneActive ? 0.25 : 0.6;
    
    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      this.scheduleNote(this.currentStep, this.nextNoteTime);
      this.nextNoteTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % 16;
    }
  }

  scheduleNote(step, time) {
    const masterVol = this.volumes.master ?? 0.7;
    const systemVol = this.volumes.system ?? 0.7;
    const musicGain = masterVol * systemVol;
    if (musicGain <= 0.001) return;

    if (!this.droneActive) {
      // IDLE THEME: calm fantasy pads
      const chordIndex = Math.floor(step / 4) % 4;
      const chord = IDLE_CHORDS[chordIndex];
      const noteIndex = step % 4;
      const freq = chord[noteIndex];
      this.playAmbientTone(freq, time, musicGain * 0.04, 1.8);
    } else {
      // ACTIVE THEME: driving combat soundtrack
      const chordIndex = Math.floor(step / 4) % 4;
      const chord = ACTIVE_CHORDS[chordIndex];
      
      // Kick on 0, 4, 8, 12
      if (step === 0 || step === 4 || step === 8 || step === 12) {
        this.playActiveKick(time, musicGain * 0.09);
      }
      
      // Snare on 4, 12
      if (step === 4 || step === 12) {
        this.playActiveSnare(time, musicGain * 0.03);
      }
      
      // Snare hat click on 2, 6, 10, 14
      if (step === 2 || step === 6 || step === 10 || step === 14) {
        this.playActiveHat(time, musicGain * 0.02);
      }
      
      // Bassline on even steps
      if (step % 2 === 0) {
        const rootFreq = chord[0];
        this.playActiveBass(rootFreq, time, musicGain * 0.05);
      }
      
      // Melodic arpeggio on odd steps
      if (step % 2 !== 0) {
        const melodyPattern = [2, 1, 3, 2, 1, 2, 3, 0];
        const noteIndex = melodyPattern[Math.floor(step / 2) % 8];
        const freq = chord[noteIndex];
        this.playActiveMelody(freq, time, musicGain * 0.025);
      }
    }
  }

  playAmbientTone(freq, time, gain, duration) {
    if (!this.ctx || typeof this.ctx.createOscillator !== "function" || typeof this.ctx.createGain !== "function") return;
    try {
      const osc = this.ctx.createOscillator();
      const amp = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      amp.gain.setValueAtTime(0.0001, time);
      amp.gain.linearRampToValueAtTime(gain, time + 0.15);
      amp.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      osc.connect(amp).connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + duration + 0.05);
    } catch (e) {}
  }

  playActiveKick(time, gain) {
    if (!this.ctx || typeof this.ctx.createOscillator !== "function" || typeof this.ctx.createGain !== "function") return;
    try {
      const osc = this.ctx.createOscillator();
      const amp = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(130, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
      amp.gain.setValueAtTime(0.0001, time);
      amp.gain.linearRampToValueAtTime(gain, time + 0.005);
      amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);
      osc.connect(amp).connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.12);
    } catch (e) {}
  }

  playActiveSnare(time, gain) {
    if (!this.ctx || !this.noiseBuffer || typeof this.ctx.createBufferSource !== "function" || typeof this.ctx.createGain !== "function" || typeof this.ctx.createBiquadFilter !== "function") return;
    try {
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;
      const amp = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1000, time);
      amp.gain.setValueAtTime(0.0001, time);
      amp.gain.linearRampToValueAtTime(gain, time + 0.005);
      amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
      source.connect(filter).connect(amp).connect(this.ctx.destination);
      source.start(time);
      source.stop(time + 0.15);
    } catch (e) {}
  }

  playActiveHat(time, gain) {
    if (!this.ctx || !this.noiseBuffer || typeof this.ctx.createBufferSource !== "function" || typeof this.ctx.createGain !== "function" || typeof this.ctx.createBiquadFilter !== "function") return;
    try {
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;
      const amp = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(7000, time);
      amp.gain.setValueAtTime(0.0001, time);
      amp.gain.linearRampToValueAtTime(gain, time + 0.002);
      amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);
      source.connect(filter).connect(amp).connect(this.ctx.destination);
      source.start(time);
      source.stop(time + 0.04);
    } catch (e) {}
  }

  playActiveBass(freq, time, gain) {
    if (!this.ctx || typeof this.ctx.createOscillator !== "function" || typeof this.ctx.createGain !== "function" || typeof this.ctx.createBiquadFilter !== "function") return;
    try {
      const osc = this.ctx.createOscillator();
      const amp = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq / 2, time);
      amp.gain.setValueAtTime(0.0001, time);
      amp.gain.linearRampToValueAtTime(gain, time + 0.01);
      amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(300, time);
      osc.connect(filter).connect(amp).connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.18);
    } catch (e) {}
  }

  playActiveMelody(freq, time, gain) {
    if (!this.ctx || typeof this.ctx.createOscillator !== "function" || typeof this.ctx.createGain !== "function") return;
    try {
      const osc = this.ctx.createOscillator();
      const amp = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq * 2, time);
      amp.gain.setValueAtTime(0.0001, time);
      amp.gain.linearRampToValueAtTime(gain, time + 0.005);
      amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
      osc.connect(amp).connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.2);
    } catch (e) {}
  }


  startDrone() {
    if (!this.enabled || !this.ctx || typeof this.ctx.createOscillator !== "function" || typeof this.ctx.createGain !== "function" || this.droneOsc) return;
    try {
      this.droneOsc = this.ctx.createOscillator();
      this.droneGain = this.ctx.createGain();

      this.droneOsc.type = "sine";
      this.droneOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

      this.droneGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      this.droneOsc.connect(this.droneGain).connect(this.ctx.destination);
      this.droneOsc.start();

      this.updateDroneVolume();
    } catch (e) {
      console.warn("Failed to start drone", e);
    }
  }

  stopDrone() {
    if (this.droneOsc) {
      try {
        this.droneOsc.stop();
        this.droneOsc.disconnect();
      } catch (e) {}
      this.droneOsc = null;
    }
    this.droneGain = null;
  }

  updateDroneVolume() {
    if (!this.droneGain || !this.ctx || typeof this.ctx.currentTime === "undefined") return;
    const masterVol = this.volumes.master ?? 0.7;
    const systemVol = this.volumes.system ?? 0.7;
    // Soft drone volume
    const baseVol = 0.012;
    const mult = this.droneActive ? 2.5 : 1.0;
    const finalVol = masterVol * systemVol * baseVol * mult;

    const now = this.ctx.currentTime;
    this.droneGain.gain.linearRampToValueAtTime(finalVol, now + 0.5);

    const targetFreq = this.droneActive ? 75 : 55;
    this.droneOsc.frequency.linearRampToValueAtTime(targetFreq, now + 1.0);
  }

  setDroneIntensity(active) {
    if (this.droneActive === active) return;
    this.droneActive = active;
    this.updateDroneVolume();
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
    } else if (type === "place") {
      if (details) this.playPlace(details, finalGain);
      else this.playUI("place", finalGain);
    } else if (type === "upgrade") {
      if (details) this.playUpgrade(details, finalGain);
      else this.playUI("upgrade", finalGain);
    } else if (type === "spawn" && details) {
      this.playSpawn(details, finalGain);
    } else if (type === "sell") {
      if (details) this.playSell(details, finalGain);
      else this.playUI("sell", finalGain);
    } else if (type === "select" && details) {
      this.playSelect(details, finalGain);
    } else if (type === "levelSelect") {
      this.playLevelSelect(finalGain);
    } else if (type === "resetLevel") {
      this.playResetLevel(finalGain);
    } else if (type === "wave" || type === "click" || type === "error") {
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
    if (!this.ctx || typeof this.ctx.createOscillator !== "function" || typeof this.ctx.createGain !== "function" || typeof this.ctx.createBiquadFilter !== "function") return;
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
