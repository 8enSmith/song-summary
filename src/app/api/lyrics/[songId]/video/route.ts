// Note: Before using this endpoint, make sure to:
// 1. Create a project in Google Cloud Console
// 2. Enable the YouTube Data API v3 for your project
// 3. Create API credentials and add them to your .env.local file as YOUTUBE_API_KEY
import { google } from 'googleapis';
import { StatusCodes } from 'http-status-codes';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title');
  const artist = searchParams.get('artist');

  if (!title || !artist) {
    return Response.json({ error: 'Missing title or artist' }, { status: 400 });
  }

  if (!process.env.YOUTUBE_API_KEY) {
    return Response.json(
      { error: 'YouTube API configuration error' },
      { status: 500 }
    );
  }

  try {
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });

    // Form a search query for YouTube
    const query = `${title} ${artist} official music video`;

    // Search for the video using the YouTube Data API
    const searchResponse = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['video'],
      maxResults: 1,
      videoEmbeddable: 'true',
    });

    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      return Response.json({ videoId: '' });
    }

    const videoId = searchResponse.data.items[0].id?.videoId || '';
    return Response.json({ videoId });
  } catch (error) {
    // Check if it's a googleapis error
    const gError = error as {
      code?: number;
      errors?: Array<{ message: string; domain: string; reason: string }>;
    };
    if (gError.code || gError.errors) {
      console.error('Google API Error:', {
        code: gError.code,
        errors: gError.errors,
      });
    }

    return Response.json(
      {
        error: 'Failed to fetch video',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: gError.code,
        apiErrors: gError.errors,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
