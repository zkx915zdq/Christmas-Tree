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

    if (enabled) {
      audio.play().catch(e => console.warn("Audio autoplay blocked:", e));
    }

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    if (audioRef.current) {
      if (enabled) {
        audioRef.current.play().catch(e => console.warn("Audio autoplay blocked:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [enabled]);

  return null;
};