import { useEffect, useRef, useCallback, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { SyncUpdatePayload, Track } from '../types';
import { api } from '../services/api';

interface UseSyncPlayerOptions {
  queue: Track[];
  isHost: boolean;
  roomCode: string;
  onPlaybackStatus?: (status: AVPlaybackStatus) => void;
}

export function useSyncPlayer({ queue, isHost, roomCode, onPlaybackStatus }: UseSyncPlayerOptions) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const queueRef = useRef<Track[]>(queue);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  // Keep queue ref in sync
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // Configure audio on mount
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    }).catch(() => {});
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const loadTrack = useCallback(async (index: number, trackOverride?: Track) => {
    const q = queueRef.current;
    const track = trackOverride || q[index];
    if (!track) {
      console.log('[player] no track at index', index);
      return;
    }

    if (soundRef.current) {
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }

    const streamUrl = api.getStreamUrl(track.youtubeId);
    console.log('[player] loading track:', track.title, streamUrl);

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        { shouldPlay: false },
        (status) => {
          if (status.isLoaded) {
            setPositionMs(status.positionMillis);
            setDurationMs(status.durationMillis || track.duration * 1000);
            setIsPlaying(status.isPlaying);
            onPlaybackStatus?.(status);
          }
        }
      );
      soundRef.current = sound;
      setCurrentTrackIndex(index);
      setDurationMs(track.duration * 1000);
      console.log('[player] loaded successfully');
    } catch (err) {
      console.error('[player] load error:', err);
    }
  }, [onPlaybackStatus]);

  const handleSyncUpdate = useCallback(async (payload: SyncUpdatePayload) => {
    const { isPlaying: shouldPlay, trackIndex, positionMs: targetPos, serverTimestamp } = payload;
    const latency = Date.now() - serverTimestamp;
    const adjustedPos = shouldPlay ? targetPos + latency : targetPos;

    if (trackIndex !== currentTrackIndex || !soundRef.current) {
      await loadTrack(trackIndex);
    }

    const sound = soundRef.current;
    if (!sound) return;

    try {
      await sound.setPositionAsync(Math.max(0, adjustedPos));
      if (shouldPlay) {
        await sound.playAsync();
      } else {
        await sound.pauseAsync();
      }
    } catch (e) {
      console.log('[player] sync update error:', e);
    }
  }, [currentTrackIndex, loadTrack]);

  const play = useCallback(async () => {
    if (!soundRef.current && queueRef.current.length > 0) {
      await loadTrack(0);
    }
    try {
      await soundRef.current?.playAsync();
      setIsPlaying(true);
    } catch (e) {
      console.log('[player] play error:', e);
    }
  }, [loadTrack]);

  const pause = useCallback(async () => {
    try {
      await soundRef.current?.pauseAsync();
      setIsPlaying(false);
    } catch (e) {
      console.log('[player] pause error:', e);
    }
  }, []);

  const seek = useCallback(async (ms: number) => {
    try {
      await soundRef.current?.setPositionAsync(ms);
    } catch {}
  }, []);

  const skip = useCallback(async () => {
    const nextIndex = currentTrackIndex + 1;
    if (nextIndex < queueRef.current.length) {
      await loadTrack(nextIndex);
      try {
        await soundRef.current?.playAsync();
        setIsPlaying(true);
      } catch {}
    }
  }, [currentTrackIndex, loadTrack]);

  return {
    isPlaying, currentTrackIndex, positionMs, durationMs,
    handleSyncUpdate, play, pause, seek, skip, loadTrack,
  };
}
