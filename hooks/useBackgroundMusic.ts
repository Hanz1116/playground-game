import { useRef, useState, useCallback, useEffect } from 'react';

const BPM = 120;
const BEAT = 60 / BPM; // 0.5s per beat
const LOOKAHEAD = 0.15; // seconds to schedule ahead
const INTERVAL = 30;   // ms between scheduler ticks

// C major pentatonic melody — 16 eighth notes = 8 beats total
// [frequency Hz, duration beats], 0 Hz = rest
const MELODY: [number, number][] = [
  [523.25, 0.5], [659.25, 0.5], [783.99, 0.5], [659.25, 0.5],
  [523.25, 0.5], [587.33, 0.5], [659.25, 0.5], [783.99, 0.5],
  [392.00, 0.5], [440.00, 0.5], [523.25, 0.5], [440.00, 0.5],
  [392.00, 0.5], [329.63, 0.5], [392.00, 0.5], [0,      0.5],
];

// Bass line — 4 half-notes = 8 beats total (aligns with melody loop)
const BASS: [number, number][] = [
  [130.81, 2.0], [196.00, 2.0],
  [130.81, 2.0], [196.00, 2.0],
];

function scheduleNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  beats: number,
  gain: number,
  type: OscillatorType,
) {
  if (freq === 0) return;
  const duration = beats * BEAT;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const attack = 0.01;
  const release = Math.min(0.08, duration * 0.3);
  gainNode.gain.setValueAtTime(0, start);
  gainNode.gain.linearRampToValueAtTime(gain, start + attack);
  gainNode.gain.setValueAtTime(gain, start + duration - release);
  gainNode.gain.linearRampToValueAtTime(0, start + duration);
  osc.connect(gainNode);
  gainNode.connect(dest);
  osc.start(start);
  osc.stop(start + duration + 0.01);
}

export function useBackgroundMusic() {
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTimeRef = useRef(0);
  const melodyIdxRef = useRef(0);
  const bassIdxRef = useRef(0);
  const startedRef = useRef(false);

  const runScheduler = useCallback(() => {
    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    while (nextTimeRef.current < ctx.currentTime + LOOKAHEAD) {
      const mi = melodyIdxRef.current;
      const [mFreq, mBeats] = MELODY[mi];
      scheduleNote(ctx, master, mFreq, nextTimeRef.current, mBeats, 0.7, 'triangle');
      // Bass note every 4 melody notes (4 × 0.5 beats = 2 beats = 1 bass note)
      if (mi % 4 === 0) {
        const bi = bassIdxRef.current;
        const [bFreq, bBeats] = BASS[bi];
        scheduleNote(ctx, master, bFreq, nextTimeRef.current, bBeats, 0.4, 'sine');
        bassIdxRef.current = (bi + 1) % BASS.length;
      }
      nextTimeRef.current += mBeats * BEAT;
      melodyIdxRef.current = (mi + 1) % MELODY.length;
    }
    timerRef.current = setTimeout(runScheduler, INTERVAL);
  }, []);

  const start = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = isMutedRef.current ? 0 : 0.5;
    master.connect(ctx.destination);
    ctxRef.current = ctx;
    masterGainRef.current = master;
    nextTimeRef.current = ctx.currentTime + 0.05;
    runScheduler();
  }, [runScheduler]);

  // Start on first user interaction (browser autoplay policy)
  useEffect(() => {
    const onInteract = () => {
      start();
      window.removeEventListener('click', onInteract);
      window.removeEventListener('keydown', onInteract);
    };
    window.addEventListener('click', onInteract);
    window.addEventListener('keydown', onInteract);
    return () => {
      window.removeEventListener('click', onInteract);
      window.removeEventListener('keydown', onInteract);
    };
  }, [start]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ctxRef.current?.close();
    };
  }, []);

  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    setIsMuted(isMutedRef.current);
    if (masterGainRef.current && ctxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        isMutedRef.current ? 0 : 0.5,
        ctxRef.current.currentTime,
        0.05,
      );
    }
  }, []);

  return { isMuted, toggleMute };
}
