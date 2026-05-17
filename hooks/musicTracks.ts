import * as Tone from 'tone';

// One TrackBuilder per game. It receives the master node, creates its synths,
// effects, and Parts on the global Tone.Transport, and returns a dispose()
// that tears everything down. The hook calls these on track switch.

export type TrackKey =
  | 'home' | 'yahtzee' | 'matching' | 'dotsAndBoxes' | 'shutTheBox' | 'wordLadder';

export type TrackController = { dispose: () => void };
export type TrackBuilder = (destination: Tone.ToneAudioNode) => TrackController;

// ── timing helpers ─────────────────────────────────────────────────────────
// Beats are 1/4-note units. We convert cumulative beats to Tone's
// "bars:beats:sixteenths" Transport-time string so the Part loops in musical
// time regardless of BPM changes.
function beatsToBBS(beats: number): string {
  const bars = Math.floor(beats / 4);
  const b = Math.floor(beats % 4);
  const s = Math.round((beats % 1) * 4 * 1000) / 1000;
  return `${bars}:${b}:${s}`;
}

type MelodyLine = Array<[note: string | null, durBeats: number]>;
type ChordLine = Array<[notes: string[] | null, durBeats: number]>;

function melodyEvents(line: MelodyLine) {
  const ev: Array<[string, { note: string; dur: number }]> = [];
  let t = 0;
  for (const [n, d] of line) {
    if (n) ev.push([beatsToBBS(t), { note: n, dur: d }]);
    t += d;
  }
  return { events: ev, total: t };
}

function chordEvents(line: ChordLine) {
  const ev: Array<[string, { notes: string[]; dur: number }]> = [];
  let t = 0;
  for (const [n, d] of line) {
    if (n) ev.push([beatsToBBS(t), { notes: n, dur: d }]);
    t += d;
  }
  return { events: ev, total: t };
}

function beatsToSeconds(beats: number): number {
  return beats * (60 / Tone.Transport.bpm.value);
}

// Build a looping melody Part for a given mono synth-like target.
function makeMelodyPart(
  synth: { triggerAttackRelease: (n: string, d: number, t: number) => void },
  line: MelodyLine,
): Tone.Part {
  const { events, total } = melodyEvents(line);
  const part = new Tone.Part((time, v: any) => {
    synth.triggerAttackRelease(v.note, beatsToSeconds(v.dur) * 0.95, time);
  }, events as any);
  part.loop = true;
  part.loopEnd = beatsToBBS(total);
  part.start('+0');
  return part;
}

function makeChordPart(
  synth: { triggerAttackRelease: (n: string[], d: number, t: number) => void },
  line: ChordLine,
): Tone.Part {
  const { events, total } = chordEvents(line);
  const part = new Tone.Part((time, v: any) => {
    synth.triggerAttackRelease(v.notes, beatsToSeconds(v.dur) * 0.95, time);
  }, events as any);
  part.loop = true;
  part.loopEnd = beatsToBBS(total);
  part.start('+0');
  return part;
}

// ── tracks ─────────────────────────────────────────────────────────────────

// HOME — warm C major welcome. Triangle lead, sine pad, soft bass.
const home: TrackBuilder = (dest) => {
  Tone.Transport.bpm.value = 96;

  const reverb = new Tone.Reverb({ decay: 4, wet: 0.4 }).connect(dest);
  const chorus = new Tone.Chorus({ frequency: 1.2, depth: 0.5, wet: 0.35 }).start().connect(reverb);

  const lead = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.04, decay: 0.25, sustain: 0.4, release: 0.6 },
    volume: -10,
  }).connect(chorus);

  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 1.5, decay: 0.4, sustain: 0.8, release: 2.5 },
    volume: -22,
  }).connect(reverb);

  const bass = new Tone.MonoSynth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.4, sustain: 0.5, release: 0.5 },
    filterEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.4, baseFrequency: 180, octaves: 2.5 },
    volume: -14,
  }).connect(reverb);

  const melPart = makeMelodyPart(lead, [
    ['C5', 1], ['E5', 1], ['G5', 1], ['E5', 1],
    ['F5', 1], ['D5', 1], ['B4', 0.5], ['D5', 0.5], ['C5', 2],
    ['E5', 0.5], ['G5', 0.5], ['C6', 1], ['G5', 1], ['A5', 1],
    ['F5', 0.5], ['E5', 0.5], ['D5', 1], ['C5', 2],
    ['A4', 1], ['C5', 1], ['E5', 1], ['G5', 1],
    ['F5', 0.5], ['E5', 0.5], ['D5', 0.5], ['C5', 0.5], ['D5', 2],
    ['G4', 1], ['B4', 1], ['D5', 1], ['F5', 1],
    ['E5', 0.5], ['D5', 0.5], ['C5', 0.5], ['B4', 0.5], ['C5', 2],
  ]);

  const bassPart = makeMelodyPart(bass as any, [
    ['C3', 2], ['G3', 2], ['A2', 2], ['F2', 2],
    ['C3', 2], ['E3', 2], ['F3', 2], ['G3', 2],
  ]);

  const chordPart = makeChordPart(pad, [
    [['C4', 'E4', 'G4'], 4],
    [['A3', 'C4', 'E4'], 4],
    [['F3', 'A3', 'C4'], 4],
    [['G3', 'B3', 'D4'], 4],
  ]);

  return {
    dispose: () => {
      melPart.stop(); melPart.dispose();
      bassPart.stop(); bassPart.dispose();
      chordPart.stop(); chordPart.dispose();
      lead.dispose(); pad.dispose(); bass.dispose();
      chorus.dispose(); reverb.dispose();
    },
  };
};

// YAHTZEE — bouncy D major. Plucky lead, bright chord stabs, walking bass.
const yahtzee: TrackBuilder = (dest) => {
  Tone.Transport.bpm.value = 124;

  const reverb = new Tone.Reverb({ decay: 2, wet: 0.22 }).connect(dest);

  const lead = new Tone.PluckSynth({
    attackNoise: 1, dampening: 5000, resonance: 0.85,
    volume: -8,
  }).connect(reverb);

  const stab = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 },
    volume: -18,
  }).connect(reverb);

  const bass = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 0.3 },
    filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3, baseFrequency: 120, octaves: 2 },
    volume: -16,
  }).connect(reverb);

  const melPart = makeMelodyPart(lead, [
    ['D5', 0.5], ['F#5', 0.5], ['A5', 0.5], ['F#5', 0.5], ['D5', 1], ['A5', 1],
    ['F#5', 0.5], ['G5', 0.5], ['A5', 0.5], ['B5', 0.5], ['A5', 1], ['F#5', 1],
    ['E5', 0.5], ['F#5', 0.5], ['G5', 0.5], ['E5', 0.5], ['F#5', 2],
    ['D5', 0.5], ['E5', 0.5], ['F#5', 0.5], ['G5', 0.5], ['A5', 1], ['D5', 1],
    ['A4', 0.5], ['D5', 0.5], ['F#5', 0.5], ['A5', 0.5], ['F#5', 1], ['D5', 1],
    ['G5', 0.5], ['F#5', 0.5], ['E5', 0.5], ['D5', 0.5], ['C#5', 0.5], ['D5', 0.5], ['E5', 1],
    ['F#5', 1], ['A5', 1], ['D6', 2],
    ['B5', 0.5], ['A5', 0.5], ['F#5', 0.5], ['E5', 0.5], ['D5', 2],
  ]);

  const bassPart = makeMelodyPart(bass as any, [
    ['D2', 1], ['A2', 1], ['D3', 1], ['A2', 1],
    ['G2', 1], ['D3', 1], ['G2', 1], ['B2', 1],
    ['A2', 1], ['E3', 1], ['A2', 1], ['C#3', 1],
    ['D2', 1], ['A2', 1], ['D3', 1], ['F#2', 1],
  ]);

  const chordPart = makeChordPart(stab, [
    [null, 0.5], [['D4', 'F#4', 'A4'], 0.5],
    [null, 0.5], [['D4', 'F#4', 'A4'], 0.5],
    [null, 0.5], [['G4', 'B4', 'D5'], 0.5],
    [null, 0.5], [['A4', 'C#5', 'E5'], 0.5],
  ]);

  return {
    dispose: () => {
      melPart.stop(); melPart.dispose();
      bassPart.stop(); bassPart.dispose();
      chordPart.stop(); chordPart.dispose();
      lead.dispose(); stab.dispose(); bass.dispose();
      reverb.dispose();
    },
  };
};

// MATCHING — music-box F major. FM bell lead, lush pad, gentle bass.
const matching: TrackBuilder = (dest) => {
  Tone.Transport.bpm.value = 84;

  const reverb = new Tone.Reverb({ decay: 6, wet: 0.5 }).connect(dest);

  const lead = new Tone.FMSynth({
    harmonicity: 3.5,
    modulationIndex: 8,
    envelope: { attack: 0.01, decay: 0.6, sustain: 0.1, release: 1.2 },
    modulationEnvelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.5 },
    volume: -12,
  }).connect(reverb);

  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 2.5, decay: 0.5, sustain: 0.9, release: 3 },
    volume: -22,
  }).connect(reverb);

  const bass = new Tone.MonoSynth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.1, decay: 0.5, sustain: 0.6, release: 1 },
    filterEnvelope: { attack: 0.1, decay: 0.3, sustain: 0.5, release: 0.5, baseFrequency: 150, octaves: 1.5 },
    volume: -16,
  }).connect(reverb);

  const melPart = makeMelodyPart(lead, [
    ['F5', 1], ['A5', 1], ['G5', 0.5], ['F5', 0.5], ['E5', 1],
    ['D5', 1], ['F5', 1], ['E5', 0.5], ['D5', 0.5], ['C5', 1],
    ['Bb4', 0.5], ['C5', 0.5], ['D5', 1], ['F5', 1], ['G5', 1],
    ['A5', 1.5], ['G5', 0.5], ['F5', 2],
    ['C5', 1], ['D5', 1], ['E5', 0.5], ['F5', 0.5], ['G5', 1],
    ['F5', 0.5], ['E5', 0.5], ['D5', 1], ['C5', 2],
    ['A4', 1], ['C5', 1], ['F5', 1], ['C5', 1],
    ['D5', 0.5], ['C5', 0.5], ['Bb4', 0.5], ['A4', 0.5], ['G4', 1], ['F4', 1],
  ]);

  const bassPart = makeMelodyPart(bass as any, [
    ['F2', 4], ['C3', 4],
    ['Bb2', 4], ['F2', 4],
    ['D3', 4], ['Bb2', 4],
    ['C3', 4], ['F2', 4],
  ]);

  const chordPart = makeChordPart(pad, [
    [['F4', 'A4', 'C5'], 4],
    [['C4', 'E4', 'G4'], 4],
    [['Bb3', 'D4', 'F4'], 4],
    [['F4', 'A4', 'C5'], 4],
    [['D4', 'F4', 'A4'], 4],
    [['Bb3', 'D4', 'F4'], 4],
    [['C4', 'E4', 'G4'], 4],
    [['F4', 'A4', 'C5'], 4],
  ]);

  return {
    dispose: () => {
      melPart.stop(); melPart.dispose();
      bassPart.stop(); bassPart.dispose();
      chordPart.stop(); chordPart.dispose();
      lead.dispose(); pad.dispose(); bass.dispose();
      reverb.dispose();
    },
  };
};

// DOTS AND BOXES — thoughtful A minor. AM synth lead, mellow pad.
const dotsAndBoxes: TrackBuilder = (dest) => {
  Tone.Transport.bpm.value = 92;

  const reverb = new Tone.Reverb({ decay: 5, wet: 0.4 }).connect(dest);
  const delay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.25, wet: 0.18 }).connect(reverb);

  const lead = new Tone.AMSynth({
    harmonicity: 2,
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.8 },
    volume: -12,
  }).connect(delay);

  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 2, decay: 0.5, sustain: 0.7, release: 2.5 },
    volume: -26,
  }).connect(reverb);

  const bass = new Tone.MonoSynth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.03, decay: 0.4, sustain: 0.5, release: 0.6 },
    filterEnvelope: { attack: 0.02, decay: 0.4, sustain: 0.4, release: 0.5, baseFrequency: 160, octaves: 2 },
    volume: -14,
  }).connect(reverb);

  const melPart = makeMelodyPart(lead, [
    ['A4', 1], ['C5', 1], ['E5', 1], ['C5', 1],
    ['D5', 0.5], ['E5', 0.5], ['F5', 1], ['E5', 1], ['D5', 1],
    ['C5', 1], ['E5', 1], ['A5', 2],
    ['G5', 0.5], ['F5', 0.5], ['E5', 0.5], ['D5', 0.5], ['C5', 1], ['B4', 1],
    ['A4', 1], ['B4', 1], ['C5', 1], ['D5', 1],
    ['E5', 0.5], ['D5', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 2],
    ['E5', 1], ['D5', 1], ['C5', 1], ['B4', 1],
    ['A4', 0.5], ['B4', 0.5], ['C5', 0.5], ['D5', 0.5], ['E5', 2],
  ]);

  const bassPart = makeMelodyPart(bass as any, [
    ['A2', 2], ['E3', 2], ['A2', 2], ['G2', 2],
    ['F2', 2], ['C3', 2], ['D3', 2], ['E3', 2],
  ]);

  const chordPart = makeChordPart(pad, [
    [['A3', 'C4', 'E4'], 4],
    [['G3', 'B3', 'D4'], 4],
    [['F3', 'A3', 'C4'], 4],
    [['E3', 'G#3', 'B3'], 4],
  ]);

  return {
    dispose: () => {
      melPart.stop(); melPart.dispose();
      bassPart.stop(); bassPart.dispose();
      chordPart.stop(); chordPart.dispose();
      lead.dispose(); pad.dispose(); bass.dispose();
      delay.dispose(); reverb.dispose();
    },
  };
};

// SHUT THE BOX — tavern jig in G major. Pluck folk lead, light hi-hat shuffle.
const shutTheBox: TrackBuilder = (dest) => {
  Tone.Transport.bpm.value = 112;

  const reverb = new Tone.Reverb({ decay: 2, wet: 0.25 }).connect(dest);

  const lead = new Tone.PluckSynth({
    attackNoise: 0.5, dampening: 4000, resonance: 0.9,
    volume: -8,
  }).connect(reverb);

  const bass = new Tone.MonoSynth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.4 },
    filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3, baseFrequency: 140, octaves: 2 },
    volume: -14,
  }).connect(reverb);

  const hat = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.04 },
    volume: -32,
  }).connect(new Tone.Filter(8000, 'highpass').connect(reverb));

  const melPart = makeMelodyPart(lead, [
    ['G4', 0.5], ['B4', 0.5], ['D5', 0.5], ['G5', 0.5], ['D5', 0.5], ['B4', 0.5], ['G4', 1],
    ['A4', 0.5], ['C5', 0.5], ['E5', 0.5], ['A5', 0.5], ['E5', 0.5], ['C5', 0.5], ['A4', 1],
    ['B4', 0.5], ['D5', 0.5], ['G5', 0.5], ['B5', 0.5], ['G5', 0.5], ['D5', 0.5], ['B4', 1],
    ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['D5', 2],
    ['G5', 0.5], ['F#5', 0.5], ['E5', 0.5], ['D5', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 1],
    ['B4', 0.5], ['C5', 0.5], ['D5', 0.5], ['E5', 0.5], ['D5', 1], ['B4', 1],
    ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['C5', 0.5], ['D5', 0.5], ['E5', 0.5], ['F#5', 0.5], ['G5', 0.5],
    ['F#5', 0.5], ['E5', 0.5], ['D5', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 1],
  ]);

  const bassPart = makeMelodyPart(bass as any, [
    ['G2', 1], ['D3', 1], ['G2', 1], ['B2', 1],
    ['C3', 1], ['G2', 1], ['D3', 1], ['G2', 1],
    ['A2', 1], ['E3', 1], ['A2', 1], ['C3', 1],
    ['D3', 1], ['A2', 1], ['D3', 1], ['G2', 1],
  ]);

  // Hi-hat on every off-beat
  const hatEvents: Array<[string, null]> = [];
  for (let beat = 0; beat < 8; beat++) {
    hatEvents.push([beatsToBBS(beat + 0.5), null]);
  }
  const hatPart = new Tone.Part((time) => {
    hat.triggerAttackRelease('16n', time);
  }, hatEvents as any);
  hatPart.loop = true;
  hatPart.loopEnd = '2m';
  hatPart.start('+0');

  return {
    dispose: () => {
      melPart.stop(); melPart.dispose();
      bassPart.stop(); bassPart.dispose();
      hatPart.stop(); hatPart.dispose();
      lead.dispose(); bass.dispose(); hat.dispose();
      reverb.dispose();
    },
  };
};

// WORD LADDER — ambient E minor. FM bell lead, lush pad, sub bass.
const wordLadder: TrackBuilder = (dest) => {
  Tone.Transport.bpm.value = 78;

  const reverb = new Tone.Reverb({ decay: 8, wet: 0.55 }).connect(dest);
  const delay = new Tone.FeedbackDelay({ delayTime: '4n.', feedback: 0.35, wet: 0.25 }).connect(reverb);

  const lead = new Tone.FMSynth({
    harmonicity: 2,
    modulationIndex: 5,
    envelope: { attack: 0.03, decay: 1.2, sustain: 0.2, release: 1.5 },
    modulationEnvelope: { attack: 0.02, decay: 0.8, sustain: 0, release: 0.5 },
    volume: -12,
  }).connect(delay);

  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'fatsawtooth', count: 3, spread: 25 } as any,
    envelope: { attack: 3, decay: 0.5, sustain: 0.9, release: 4 },
    volume: -24,
  }).connect(reverb);

  const bass = new Tone.MonoSynth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 1.5 },
    filterEnvelope: { attack: 0.5, decay: 0.5, sustain: 0.7, release: 1, baseFrequency: 100, octaves: 1 },
    volume: -14,
  }).connect(reverb);

  const melPart = makeMelodyPart(lead, [
    ['E5', 1], ['G5', 1], ['B5', 2],
    ['A5', 0.5], ['G5', 0.5], ['F#5', 0.5], ['E5', 0.5], ['D5', 1], ['B4', 1],
    ['E5', 1], ['F#5', 1], ['G5', 1], ['A5', 1],
    ['B5', 1.5], ['A5', 0.5], ['G5', 2],
    ['D5', 1], ['E5', 1], ['F#5', 1], ['G5', 1],
    ['F#5', 0.5], ['E5', 0.5], ['D5', 0.5], ['C#5', 0.5], ['B4', 2],
    ['G4', 1], ['B4', 1], ['E5', 1], ['G5', 1],
    ['F#5', 0.5], ['E5', 0.5], ['D5', 0.5], ['B4', 0.5], ['E5', 2],
  ]);

  const bassPart = makeMelodyPart(bass as any, [
    ['E2', 4], ['B2', 4],
    ['A2', 4], ['G2', 4],
    ['D3', 4], ['A2', 4],
    ['B2', 4], ['E2', 4],
  ]);

  const chordPart = makeChordPart(pad, [
    [['E3', 'G3', 'B3'], 4],
    [['B2', 'D3', 'F#3'], 4],
    [['A2', 'C3', 'E3'], 4],
    [['G2', 'B2', 'D3'], 4],
    [['D3', 'F#3', 'A3'], 4],
    [['A2', 'C3', 'E3'], 4],
    [['B2', 'D3', 'F#3'], 4],
    [['E3', 'G3', 'B3'], 4],
  ]);

  return {
    dispose: () => {
      melPart.stop(); melPart.dispose();
      bassPart.stop(); bassPart.dispose();
      chordPart.stop(); chordPart.dispose();
      lead.dispose(); pad.dispose(); bass.dispose();
      delay.dispose(); reverb.dispose();
    },
  };
};

export const TRACKS: Record<TrackKey, TrackBuilder> = {
  home, yahtzee, matching, dotsAndBoxes, shutTheBox, wordLadder,
};
