import { openai } from '@ai-sdk/openai';
import { transcribe } from 'ai';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { withAuth } from '@/lib/auth/with-auth';
import { withErrorHandler } from '@/lib/errors/with-error-handler';
import { ApiResponse } from '@/lib/types/api';

const transcribeSchema = z.object({
  audioUrl: z.string().url().optional(),
  audio: z.string().optional(), // base64 encoded audio
});

async function transcribeAudio(request: NextRequest): Promise<ApiResponse<any>> {
  const formData = await request.formData();
  const audioFile = formData.get('audio') as File;
  const audioUrl = formData.get('audioUrl') as string;

  if (!audioFile && !audioUrl) {
    return {
      success: false,
      error: 'Either audio file or audioUrl is required',
    };
  }

  try {
    let audioInput: string | Uint8Array;

    if (audioFile) {
      // Convert File to Uint8Array
      const arrayBuffer = await audioFile.arrayBuffer();
      audioInput = new Uint8Array(arrayBuffer);
    } else if (audioUrl) {
      // Use URL directly
      audioInput = audioUrl;
    } else {
      return {
        success: false,
        error: 'Invalid audio input',
      };
    }

    const { text, segments } = await transcribe({
      model: openai('whisper-1'),
      audio: audioInput,
    });

    return {
      success: true,
      data: {
        transcript: text,
        segments: segments || [],
        duration: segments?.reduce((total, segment) => Math.max(total, segment.end), 0) || 0,
      },
    };
  } catch (error) {
    console.error('Transcription error:', error);
    return {
      success: false,
      error: 'Failed to transcribe audio. Please try again.',
    };
  }
}

export const POST = withAuth(withErrorHandler(transcribeAudio));