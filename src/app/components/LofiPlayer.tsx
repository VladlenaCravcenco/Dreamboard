import React, { useState, useRef, useEffect } from 'react';
import { Volume2 } from 'lucide-react';

// Free lofi music streams (direct audio streams)
const LOFI_STATIONS = [
  {
    name: 'Lofi Hip Hop Radio',
    url: 'https://stream.zeno.fm/f3wvbbqmdg8uv', // 24/7 Lofi Hip Hop
    emoji: '📚'
  },
  {
    name: 'Chillhop Radio',
    url: 'https://stream.zeno.fm/fyn8eh3h5f8uv', // Chillhop 24/7 (fixed HTTPS)
    emoji: '☕'
  },
  {
    name: 'SomaFM Groove',
    url: 'https://ice1.somafm.com/groovesalad-128-mp3', // SomaFM Groove Salad
    emoji: '🌙'
  },
];

export function LofiPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume] = useState(0.3); // Fixed volume at 30%
  const [currentStation] = useState(0); // Fixed at first station
  const audioRef = useRef<HTMLAudioElement>(null);

  // Keep music playing when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (audioRef.current && isPlaying && document.hidden) {
        // Force continue playing when tab is hidden
        audioRef.current.play().catch(err => {
          console.log('Background playback:', err);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  // Set volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(err => {
          console.log('Playback failed:', err);
        });
        setIsPlaying(true);
      }
    }
  };

  return (
    <>
      {/* Simple Floating Toggle Button */}
      <button
        onClick={togglePlay}
        className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-[#B8935E] hover:bg-[#A17D4A] text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
        aria-label={isPlaying ? 'Pause Music' : 'Play Music'}
        title={isPlaying ? 'Pause Lofi Music' : 'Play Lofi Music'}
      >
        {isPlaying ? (
          <div className="flex flex-col items-center">
            <Volume2 className="w-5 h-5" />
            <div className="flex gap-0.5 mt-1">
              <div className="w-0.5 h-1.5 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-0.5 h-2 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-0.5 h-1.5 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        ) : (
          <span className="text-xl">🎵</span>
        )}
      </button>

      {/* Audio element with actual stream */}
      <audio
        ref={audioRef}
        preload="metadata"
        playsInline
        crossOrigin="anonymous"
        loop
        onEnded={() => {
          // Restart if stream ends
          if (audioRef.current) {
            audioRef.current.play();
          }
        }}
        onError={(e) => {
          console.error('Audio error:', e);
          setIsPlaying(false);
        }}
        onStalled={() => {
          // Try to resume if stalled
          if (audioRef.current && isPlaying) {
            audioRef.current.load();
            audioRef.current.play();
          }
        }}
      >
        <source src={LOFI_STATIONS[currentStation].url} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </>
  );
}