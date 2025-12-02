
import React, { useEffect, useRef } from 'react';

interface MusicProps {
  enabled: boolean;
  src: string | null;
}

const DEFAULT_BGM = "https://cdn.pixabay.com/audio/2022/12/13/audio_7366710488.mp3";

export const Music: React.FC<MusicProps> = ({ enabled, src }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Stop previous if exists
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(src || DEFAULT_BGM);
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    // Do NOT auto-play here based on 'enabled' prop immediately
    // Wait for the specific effect below to handle start/restart logic

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [src]);

  // Handle Play/Pause and Restart
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (enabled) {
      // RESTART Logic: Reset time to 0 when enabled becomes true
      audio.currentTime = 0;
      audio.play().catch(e => console.warn("Audio autoplay blocked:", e));
    } else {
      audio.pause();
    }
  }, [enabled]);

  return null;
};
