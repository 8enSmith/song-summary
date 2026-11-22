import { StatusCodes } from 'http-status-codes';
import { NextResponse } from 'next/server';

export const POST = async (req: Request) => {
  try {
    const { text } = await req.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text parameter is required' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // ElevenLabs API requires an API key
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: 'ElevenLabs API key is not configured' },
        { status: StatusCodes.INTERNAL_SERVER_ERROR }
      );
    }
    
    // Using ElevenLabs voice ID for "Rachel" - you can change this to any voice ID from your ElevenLabs account
    // See https://api.elevenlabs.io/v1/voices for available voices
    const VOICE_ID = 'onwK4e9ZLuTAKqWW03F9'; // Daniel
    
    // Call ElevenLabs API to convert text to speech
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: response.status }
      );
    }
    
    // Get the audio data from the response
    const audioData = await response.arrayBuffer();
    
    // Return the audio data with the appropriate content type
    return new NextResponse(audioData, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('Error in TTS endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
};