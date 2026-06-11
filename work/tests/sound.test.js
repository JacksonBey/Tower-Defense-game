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
    let playPlaceCalled = null;
    let playUpgradeCalled = null;
    let playSpawnCalled = null;
    let playSellCalled = null;
    let playSelectCalled = null;
    let playLevelSelectCalled = false;
    let playResetLevelCalled = false;

    sounds.playShoot = (type, gain) => { playShootCalled = { type, gain }; };
    sounds.playDefeat = (type, gain) => { playDefeatCalled = { type, gain }; };
    sounds.playUI = (type, gain) => { playUICalled = { type, gain }; };
    sounds.playPlace = (type, gain) => { playPlaceCalled = { type, gain }; };
    sounds.playUpgrade = (type, gain) => { playUpgradeCalled = { type, gain }; };
    sounds.playSpawn = (type, gain) => { playSpawnCalled = { type, gain }; };
    sounds.playSell = (type, gain) => { playSellCalled = { type, gain }; };
    sounds.playSelect = (type, gain) => { playSelectCalled = { type, gain }; };
    sounds.playLevelSelect = (gain) => { playLevelSelectCalled = true; };
    sounds.playResetLevel = (gain) => { playResetLevelCalled = true; };

    sounds.play("shoot", 1.0, "punch");
    expect(playShootCalled.type).toBe("punch");
    expect(playShootCalled.gain).toBeCloseTo(0.49);

    sounds.play("defeat", 1.0, "vault");
    expect(playDefeatCalled.type).toBe("vault");
    expect(playDefeatCalled.gain).toBeCloseTo(0.49);

    sounds.play("place");
    expect(playUICalled.type).toBe("place");
    expect(playUICalled.gain).toBeCloseTo(0.49);

    sounds.play("place", 1.0, "punch");
    expect(playPlaceCalled.type).toBe("punch");
    expect(playPlaceCalled.gain).toBeCloseTo(0.49);

    sounds.play("upgrade", 1.0, "radio");
    expect(playUpgradeCalled.type).toBe("radio");
    expect(playUpgradeCalled.gain).toBeCloseTo(0.49);

    sounds.play("spawn", 1.0, "vault");
    expect(playSpawnCalled.type).toBe("vault");
    expect(playSpawnCalled.gain).toBeCloseTo(0.49);

    sounds.play("sell", 1.0, "tax");
    expect(playSellCalled.type).toBe("tax");
    expect(playSellCalled.gain).toBeCloseTo(0.49);

    sounds.play("select", 1.0, "freezer");
    expect(playSelectCalled.type).toBe("freezer");
    expect(playSelectCalled.gain).toBeCloseTo(0.49);

    sounds.play("levelSelect");
    expect(playLevelSelectCalled).toBe(true);

    sounds.play("resetLevel");
    expect(playResetLevelCalled).toBe(true);
  });

  it("handles ambient drone toggles and updates", () => {
    const sounds = new SoundSystem();
    sounds.enabled = true;
    
    let droneStarted = false;
    let droneStopped = false;
    let droneVolumeUpdated = false;
    
    sounds.startDrone = () => { droneStarted = true; };
    sounds.stopDrone = () => { droneStopped = true; };
    sounds.updateDroneVolume = () => { droneVolumeUpdated = true; };
    
    sounds.setDroneIntensity(true);
    expect(sounds.droneActive).toBe(true);
    expect(droneVolumeUpdated).toBe(true);
    
    // Test state change check
    droneVolumeUpdated = false;
    sounds.setDroneIntensity(true);
    expect(droneVolumeUpdated).toBe(false); // Guard prevents update
    
    sounds.disable();
    expect(droneStopped).toBe(true);
  });
});
