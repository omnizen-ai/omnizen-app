'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Loader2 } from 'lucide-react';
import type { Attachment } from '@/lib/types';
import { Button } from './ui/button';
import { CrossSmallIcon } from './icons';
import { Badge } from './ui/badge';

interface VoiceMessagePreviewProps {
  attachment: Attachment;
  isUploading?: boolean;
  onRemove?: () => void;
}

export function VoiceMessagePreview({
  attachment,
  isUploading = false,
  onRemove,
}: VoiceMessagePreviewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  const { name, url, metadata } = attachment;
  const transcript = metadata?.transcript;
  const isTranscribing = metadata?.transcribing;
  const transcriptionError = metadata?.transcriptionError;
  const audioDuration = metadata?.duration || duration;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      data-testid="voice-message-preview" 
      className="group relative min-w-64 max-w-sm rounded-lg bg-muted border p-3"
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} src={url} />

      {/* Header with voice icon and remove button */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-blue-600" />
          <span className="text-xs font-medium text-muted-foreground">Voice Message</span>
        </div>
        
        {onRemove && !isUploading && (
          <Button
            onClick={onRemove}
            size="sm"
            variant="destructive"
            className="opacity-0 group-hover:opacity-100 transition-opacity size-4 p-0 rounded-full"
          >
            <CrossSmallIcon size={8} />
          </Button>
        )}
      </div>

      {/* Audio player controls */}
      <div className="flex items-center gap-3 mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={togglePlay}
          disabled={isUploading}
          className="size-8 p-0 rounded-full"
        >
          {isPlaying ? (
            <Pause size={14} />
          ) : (
            <Play size={14} className="ml-0.5" />
          )}
        </Button>

        {/* Progress bar */}
        <div className="flex-1 h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Duration */}
        <span className="text-xs text-muted-foreground font-mono">
          {formatTime(currentTime)} / {formatTime(audioDuration)}
        </span>
      </div>

      {/* Transcription status and content */}
      <div className="space-y-2">
        {isTranscribing && (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <Loader2 size={12} className="animate-spin" />
            <span>Transcribing...</span>
          </div>
        )}

        {transcriptionError && (
          <Badge variant="destructive" className="text-xs">
            Transcription failed
          </Badge>
        )}

        {transcript && (
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranscript(!showTranscript)}
              className="h-auto p-1 text-xs text-blue-600 hover:text-blue-700"
            >
              {showTranscript ? 'Hide' : 'Show'} transcript
            </Button>

            {showTranscript && (
              <div className="bg-background/50 rounded p-2 text-xs text-foreground border">
                <p className="leading-relaxed">{transcript}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload progress overlay */}
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={20} className="animate-spin text-blue-600" />
            <span className="text-xs text-muted-foreground">Uploading...</span>
          </div>
        </div>
      )}

      {/* File name at bottom */}
      <div className="text-[10px] text-muted-foreground mt-1 truncate">
        {name}
      </div>
    </div>
  );
}