'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RadiobuttonIcon, MaskOnIcon } from '@radix-ui/react-icons';

interface VoiceRecorderProps {
  isRecording: boolean;
  onRecordingStart: () => void;
  onRecordingStop: (audioBlob: Blob) => void;
  onRecordingError: (error: string) => void;
}

export function VoiceRecorder({
  isRecording,
  onRecordingStart,
  onRecordingStop,
  onRecordingError
}: VoiceRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if MediaRecorder and getUserMedia are supported in the browser
    setIsSupported(
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'mediaDevices' in navigator &&
      'getUserMedia' in navigator.mediaDevices &&
      'MediaRecorder' in window
    );
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      onRecordingError('Voice recording is not supported in this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        onRecordingStop(audioBlob);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        onRecordingError('Recording failed. Please try again.');
      };

      mediaRecorder.start();
      onRecordingStart();
    } catch (error) {
      console.error('Error starting recording:', error);
      onRecordingError('Could not access microphone. Please check permissions.');
    }
  }, [isSupported, onRecordingStart, onRecordingStop, onRecordingError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleRecording}
      disabled={!isSupported}
      className={isRecording ? 'bg-red-50 border-red-200 text-red-600' : ''}
      title={isSupported ? 'Record voice message' : 'Voice recording not supported in this browser'}
    >
      {isRecording ? (
        <MaskOnIcon className="size-4" />
      ) : (
        <RadiobuttonIcon className="size-4" />
      )}
    </Button>
  );
}