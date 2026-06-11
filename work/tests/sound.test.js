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
});
