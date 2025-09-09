import { openai } from '@ai-sdk/openai';
import { experimental_transcribe } from 'ai';

export interface TranscriptionResult {
  success: boolean;
  transcript?: string;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  duration?: number;
  confidence?: number;
  error?: string;
}

export interface TranscriptionOptions {
  provider?: 'openai';
  model?: string;
  language?: string;
}

/**
 * Transcription service for audio files using AI SDK
 */
export class TranscriptionService {
  /**
   * Transcribe audio file to text
   */
  async transcribeAudio(
    audioInput: string | Uint8Array | Buffer,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    const { 
      provider = 'openai', 
      model = 'whisper-1',
      language 
    } = options;

    try {
      // Convert Buffer to Uint8Array if needed
      let input: string | Uint8Array;
      if (Buffer.isBuffer(audioInput)) {
        input = new Uint8Array(audioInput);
      } else {
        input = audioInput;
      }

      const { text, segments } = await experimental_transcribe({
        model: openai.transcription(model),
        audio: input,
        ...(language && { language }),
      });

      // Calculate average confidence if available
      const confidence = segments?.length 
        ? segments.reduce((sum, seg) => sum + (seg.confidence || 1), 0) / segments.length
        : 1.0;

      // Calculate duration from segments
      const duration = segments?.length 
        ? Math.max(...segments.map(seg => seg.end))
        : 0;

      return {
        success: true,
        transcript: text,
        segments: segments?.map(seg => ({
          text: seg.text,
          start: seg.start,
          end: seg.end,
        })),
        duration,
        confidence,
      };

    } catch (error) {
      console.error('[TranscriptionService] Transcription failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transcription failed',
      };
    }
  }

  /**
   * Transcribe audio from file URL
   */
  async transcribeFromUrl(
    audioUrl: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    try {
      // Fetch audio file
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      return this.transcribeAudio(new Uint8Array(audioBuffer), options);

    } catch (error) {
      console.error('[TranscriptionService] URL transcription failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to transcribe from URL',
      };
    }
  }

  /**
   * Check if a MIME type is supported for transcription
   */
  isSupportedAudioType(mimeType: string): boolean {
    const supportedTypes = [
      'audio/wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/x-m4a',
      'audio/m4a',
      'audio/webm',
      'audio/ogg',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];

    return supportedTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Estimate transcription time (usually faster than real-time)
   */
  estimateTranscriptionTime(audioDurationSeconds: number): number {
    // Whisper is typically 2-3x faster than real-time
    return Math.max(audioDurationSeconds / 2, 1); // Minimum 1 second
  }
}

// Export singleton instance
export const transcriptionService = new TranscriptionService();