import * as Tone from 'tone';

// Lightweight, synthesized interaction sounds. Shares the Web Audio context
// that useBackgroundMusic starts on the first user gesture, so no extra setup
// is needed — we just lazily build our voices the first time a sound plays.
//
// Everything routes through our own output Gain (independent of the music
// master) and respects a single shared mute flag, so the speaker button in the
// corner silences music and effects together.

export type SfxName =
    | 'click'        // generic button / UI tap
    | 'toggle'       // hold a die, select a tile
    | 'diceRoll'     // rolling dice
    | 'cardFlip'     // flip a memory card
    | 'match'        // matched pair
    | 'noMatch'      // mismatched pair
    | 'lineDraw'     // draw a line in dots & boxes
    | 'boxClaim'     // complete a box
    | 'score'        // commit a score / confirm a move
    | 'wordValid'    // accepted word in word ladder
    | 'wordError'    // rejected word / invalid input
    | 'place'        // place a ship
    | 'hit'          // battleship hit
    | 'miss'         // battleship miss
    | 'sunk'         // battleship ship sunk
    | 'win';         // game over fanfare

type Voices = {
    blip: Tone.Synth;
    poly: Tone.PolySynth;
    membrane: Tone.MembraneSynth;
    noise: Tone.NoiseSynth;
    noiseFilter: Tone.Filter;
};

let voices: Voices | null = null;
let muted = false;

export function setSfxMuted(value: boolean) {
    muted = value;
}

// Build the voices once the audio context is actually running. Returns null if
// it isn't yet (e.g. a sound fired on the very first gesture, before
// Tone.start() resolved) — in that rare case we simply skip the sound.
function ensureVoices(): Voices | null {
    if (voices) return voices;
    if (Tone.getContext().state !== 'running') return null;

    const out = new Tone.Gain(0.55).toDestination();
    const reverb = new Tone.Reverb({ decay: 1.1, wet: 0.15 }).connect(out);

    const blip = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.004, decay: 0.12, sustain: 0, release: 0.08 },
        volume: -12,
    }).connect(reverb);

    const poly = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.25, sustain: 0.05, release: 0.4 },
        volume: -14,
    }).connect(reverb);

    const membrane = new Tone.MembraneSynth({
        pitchDecay: 0.03,
        octaves: 5,
        envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
        volume: -8,
    }).connect(out);

    const noiseFilter = new Tone.Filter(1500, 'lowpass').connect(out);
    const noise = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.004, decay: 0.18, sustain: 0, release: 0.1 },
        volume: -18,
    }).connect(noiseFilter);

    voices = { blip, poly, membrane, noise, noiseFilter };
    return voices;
}

const EFFECTS: Record<SfxName, (v: Voices, t: number) => void> = {
    click: (v, t) => v.blip.triggerAttackRelease('C6', 0.04, t),

    toggle: (v, t) => v.blip.triggerAttackRelease('A5', 0.05, t, 0.8),

    diceRoll: (v, t) => {
        // A quick rattle of filtered noise, capped with a low tumble.
        v.noiseFilter.frequency.setValueAtTime(2600, t);
        for (let i = 0; i < 4; i++) v.noise.triggerAttackRelease(0.05, t + i * 0.06);
        v.membrane.triggerAttackRelease('C2', 0.12, t + 0.26);
    },

    cardFlip: (v, t) => {
        v.noiseFilter.frequency.setValueAtTime(4000, t);
        v.noise.triggerAttackRelease(0.03, t);
        v.blip.triggerAttackRelease('E6', 0.05, t + 0.02);
    },

    match: (v, t) => {
        v.poly.triggerAttackRelease('C5', 0.18, t);
        v.poly.triggerAttackRelease('E5', 0.18, t + 0.1);
        v.poly.triggerAttackRelease('G5', 0.3, t + 0.2);
    },

    noMatch: (v, t) => {
        v.poly.triggerAttackRelease('E4', 0.18, t);
        v.poly.triggerAttackRelease('Bb3', 0.32, t + 0.12);
    },

    lineDraw: (v, t) => {
        v.noiseFilter.frequency.setValueAtTime(3500, t);
        v.noise.triggerAttackRelease(0.04, t);
        v.blip.triggerAttackRelease('B5', 0.05, t + 0.01);
    },

    boxClaim: (v, t) => {
        v.poly.triggerAttackRelease('C5', 0.12, t);
        v.poly.triggerAttackRelease('G5', 0.12, t + 0.08);
        v.poly.triggerAttackRelease('C6', 0.25, t + 0.16);
    },

    score: (v, t) => {
        v.poly.triggerAttackRelease('G5', 0.12, t);
        v.poly.triggerAttackRelease('C6', 0.22, t + 0.1);
    },

    wordValid: (v, t) => {
        v.blip.triggerAttackRelease('E5', 0.08, t);
        v.blip.triggerAttackRelease('A5', 0.14, t + 0.09);
    },

    wordError: (v, t) => {
        v.poly.triggerAttackRelease(['B3', 'C4'], 0.22, t);
    },

    place: (v, t) => {
        v.noiseFilter.frequency.setValueAtTime(1200, t);
        v.noise.triggerAttackRelease(0.06, t);
        v.membrane.triggerAttackRelease('C2', 0.12, t);
    },

    hit: (v, t) => {
        v.noiseFilter.frequency.setValueAtTime(900, t);
        v.noise.triggerAttackRelease(0.3, t);
        v.membrane.triggerAttackRelease('C1', 0.4, t);
    },

    miss: (v, t) => {
        // Watery splash: a short noise burst swept from bright to dark.
        v.noiseFilter.frequency.cancelScheduledValues(t);
        v.noiseFilter.frequency.setValueAtTime(3000, t);
        v.noiseFilter.frequency.exponentialRampToValueAtTime(500, t + 0.22);
        v.noise.triggerAttackRelease(0.22, t);
    },

    sunk: (v, t) => {
        v.noiseFilter.frequency.setValueAtTime(800, t);
        v.noise.triggerAttackRelease(0.5, t);
        v.membrane.triggerAttackRelease('G1', 0.3, t);
        v.membrane.triggerAttackRelease('C1', 0.5, t + 0.18);
    },

    win: (v, t) => {
        const notes = ['C5', 'E5', 'G5', 'C6'];
        notes.forEach((n, i) => v.poly.triggerAttackRelease(n, 0.3, t + i * 0.12));
        v.poly.triggerAttackRelease(['C5', 'E5', 'G5', 'C6'], 0.6, t + notes.length * 0.12);
    },
};

export function playSfx(name: SfxName) {
    if (muted) return;
    const v = ensureVoices();
    if (!v) return;
    try {
        EFFECTS[name](v, Tone.now());
    } catch {
        // Never let an audio hiccup break gameplay.
    }
}
