import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2, Volume2, Mic, AlertCircle } from 'lucide-react';

interface WhatsAppAudioPlayerProps {
  src: string;
  isOutbound?: boolean;
}

export const WhatsAppAudioPlayer: React.FC<WhatsAppAudioPlayerProps> = ({
  src,
  isOutbound = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsLoading(false);
      setHasError(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && duration === 0) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setHasError(true);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [duration, src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || hasError) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.warn('Audio playback error:', err);
        setHasError(true);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const togglePlaybackRate = () => {
    const audio = audioRef.current;
    const rates: (1 | 1.5 | 2)[] = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audio) {
      audio.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div className="w-[280px] sm:w-[320px] max-w-full py-1.5 px-0.5 select-none">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Main Controls Row */}
      <div className="flex items-center gap-3">
        {/* Play / Pause / Loading Button */}
        <button
          type="button"
          onClick={togglePlay}
          disabled={hasError}
          className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-sm ${
            hasError
              ? 'bg-rose-100 text-rose-500 cursor-not-allowed'
              : isOutbound
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
          title={isPlaying ? 'Pause' : 'Play audio'}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : hasError ? (
            <AlertCircle className="h-5 w-5" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-4 w-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Seek Track / Scrool Bar */}
        <div className="flex-1 flex flex-col justify-center gap-1.5">
          <div className="relative flex items-center h-4 group cursor-pointer">
            {/* Background Track */}
            <div
              className={`w-full h-1.5 rounded-full overflow-hidden ${
                isOutbound ? 'bg-emerald-200/80' : 'bg-slate-200'
              }`}
            >
              {/* Progress Bar Fill */}
              <div
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Draggable Seeker Thumb */}
            <div
              className="absolute h-3.5 w-3.5 bg-emerald-700 rounded-full shadow-md pointer-events-none transform -translate-x-1/2 transition-transform group-hover:scale-125"
              style={{ left: `${progressPercent}%` }}
            />

            {/* Accessible HTML Range Input Overlay */}
            <input
              type="range"
              min={0}
              max={duration > 0 ? duration : 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              disabled={hasError || duration === 0}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              title="Seek audio position"
            />
          </div>

          {/* Timing & Mic / Speed Indicator */}
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
            <span className="font-mono">
              {formatTime(currentTime)}
              <span className="text-slate-400 mx-1">/</span>
              {duration > 0 ? formatTime(duration) : '--:--'}
            </span>

            <div className="flex items-center gap-2">
              {/* Playback speed toggle */}
              <button
                type="button"
                onClick={togglePlaybackRate}
                className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-black/5 hover:bg-black/10 transition-colors text-slate-700"
                title="Change playback speed"
              >
                {playbackRate}x
              </button>

              {/* WhatsApp Voice Note Mic badge */}
              <span
                className={`p-1 rounded-full ${
                  isOutbound ? 'text-emerald-700' : 'text-slate-500'
                }`}
                title="Voice Note"
              >
                <Mic className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {hasError && (
        <div className="mt-1.5 text-[10px] text-rose-600 flex items-center justify-between">
          <span>Failed to load audio stream</span>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="underline font-semibold hover:text-rose-700"
          >
            Open in new tab
          </a>
        </div>
      )}
    </div>
  );
};
