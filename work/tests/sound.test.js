// Reference: SYSTEM.md#Audio-System
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SoundSystem } from "../src/sound.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear()
  };
}

describe("sound system", () => {
  beforeEach(() => {
    globalThis.localStorage = createStorage();
  });

  afterEach(() => {
    delete globalThis.localStorage;
    delete globalThis.AudioContext;
    vi.restoreAllMocks();
  });

  it("loads and persists per-channel volumes", () => {
    localStorage.setItem("runehold-volume-master", "0.25");
    const sounds = new SoundSystem();
    expect(sounds.volumes.master).toBe(0.25);

    sounds.setVolume("combat", 0.4);
    expect(sounds.volumes.combat).toBe(0.4);
    expect(localStorage.getItem("runehold-volume-combat")).toBe("0.4");
  });

  it("persists enabled state without requiring real audio output", async () => {
    const resume = vi.fn().mockResolvedValue(undefined);
    globalThis.AudioContext = vi.fn(function AudioContext() {
      return { resume };
    });

    const sounds = new SoundSystem();
    await sounds.enable(false);
    expect(sounds.enabled).toBe(true);
    expect(resume).toHaveBeenCalledOnce();
    expect(localStorage.getItem("runehold-sound-enabled")).toBe("true");

    sounds.disable();
    expect(sounds.enabled).toBe(false);
    expect(localStorage.getItem("runehold-sound-enabled")).toBe("false");
  });

  it("uses master and channel volume when playing cues", () => {
    const sounds = new SoundSystem();
    const tones = [];
    sounds.enabled = true;
    sounds.ctx = {};
    sounds.tone = (...args) => tones.push(args);
    sounds.setVolume("master", 0.5);
    sounds.setVolume("combat", 0.5);

    sounds.play("defeat");
    expect(tones[0][2]).toBeCloseTo(0.0375);

    tones.length = 0;
    sounds.setVolume("combat", 0);
    sounds.play("defeat");
    expect(tones).toHaveLength(0);
  });

  it("speaks announcements using Web Speech API", () => {
    const speakCalls = [];
    globalThis.window = {
      speechSynthesis: {
        cancel: vi.fn(),
        speak: (utterance) => speakCalls.push(utterance),
        getVoices: () => [{ name: "Google US English", lang: "en-US" }]
      }
    };
    globalThis.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
        this.pitch = 1.0;
        this.rate = 1.0;
        this.volume = 1.0;
      }
    };

    const sounds = new SoundSystem();
    sounds.enabled = true;
    sounds.speak("Hello World");

    expect(window.speechSynthesis.cancel).toHaveBeenCalledOnce();
    expect(speakCalls).toHaveLength(1);
    expect(speakCalls[0].text).toBe("Hello World");
    expect(speakCalls[0].pitch).toBe(0.8);
    expect(speakCalls[0].rate).toBe(0.85);

    delete globalThis.window;
    delete globalThis.SpeechSynthesisUtterance;
  });

  it("triggers custom synthesizers based on tower or enemy types", () => {
    const sounds = new SoundSystem();
    sounds.enabled = true;
    sounds.ctx = {};

    let playShootCalled = null;
    let playDefeatCalled = null;
    let playUICalled = null;

    sounds.playShoot = (type, gain) => { playShootCalled = { type, gain }; };
    sounds.playDefeat = (type, gain) => { playDefeatCalled = { type, gain }; };
    sounds.playUI = (type, gain) => { playUICalled = { type, gain }; };

    sounds.play("shoot", 1.0, "punch");
    expect(playShootCalled.type).toBe("punch");
    expect(playShootCalled.gain).toBeCloseTo(0.49);

    sounds.play("defeat", 1.0, "vault");
    expect(playDefeatCalled.type).toBe("vault");
    expect(playDefeatCalled.gain).toBeCloseTo(0.49);

    sounds.play("place");
    expect(playUICalled.type).toBe("place");
    expect(playUICalled.gain).toBeCloseTo(0.49);
  });
});
