import { useRef, useState, useCallback, useEffect } from 'react';
import * as Tone from 'tone';
import { TRACKS, type TrackKey, type TrackController } from './musicTracks';
import { setSfxMuted } from './soundEffects';

export function useBackgroundMusic(trackKey: TrackKey) {
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const startedRef = useRef(false);
  const masterRef = useRef<Tone.Gain | null>(null);
  const controllerRef = useRef<TrackController | null>(null);
  const currentKeyRef = useRef<TrackKey | null>(null);
  const trackKeyRef = useRef<TrackKey>(trackKey);
  trackKeyRef.current = trackKey;

  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    await Tone.start();
    const master = new Tone.Gain(isMutedRef.current ? 0 : 0.7).toDestination();
    masterRef.current = master;
    Tone.Transport.start();
    controllerRef.current = TRACKS[trackKeyRef.current](master);
    currentKeyRef.current = trackKeyRef.current;
  }, []);

  // Browser autoplay: wait for first user interaction.
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

  // Swap track on key change. Brief crossfade so changes aren't jarring.
  useEffect(() => {
    if (!startedRef.current) return;
    if (currentKeyRef.current === trackKey) return;
    const master = masterRef.current;
    if (!master) return;

    const fadeOut = 0.2;
    const fadeIn = 0.3;
    const now = Tone.now();
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + fadeOut);

    const timer = setTimeout(() => {
      controllerRef.current?.dispose();
      controllerRef.current = TRACKS[trackKey](master);
      currentKeyRef.current = trackKey;
      const t = Tone.now();
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(0, t);
      master.gain.linearRampToValueAtTime(isMutedRef.current ? 0 : 0.7, t + fadeIn);
    }, fadeOut * 1000 + 20);

    return () => clearTimeout(timer);
  }, [trackKey]);

  useEffect(() => {
    return () => {
      controllerRef.current?.dispose();
      controllerRef.current = null;
      Tone.Transport.stop();
      masterRef.current?.dispose();
      masterRef.current = null;
    };
  }, []);

  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    setIsMuted(isMutedRef.current);
    setSfxMuted(isMutedRef.current);
    const master = masterRef.current;
    if (master) {
      const t = Tone.now();
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(isMutedRef.current ? 0 : 0.7, t + 0.1);
    }
  }, []);

  return { isMuted, toggleMute };
}
