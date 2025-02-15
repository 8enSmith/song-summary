// Note: Before using this endpoint, make sure to:
// 1. Create a project in Google Cloud Console
// 2. Enable the YouTube Data API v3 for your project
// 3. Create API credentials and add them to your .env.local file as YOUTUBE_API_KEY
import { google } from 'googleapis';

export async function GET(
  request: Request,
  { params }: { params: { songId: string } }
) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title');
  const artist = searchParams.get('artist');

  if (!title || !artist) {
    return Response.json({ error: 'Missing title or artist' }, { status: 400 });
  }

  if (!process.env.YOUTUBE_API_KEY) {
    console.error('YouTube API key is not configured');
    return Response.json(
      { error: 'YouTube API configuration error' },
      { status: 500 }
    );
  }

  try {
    console.log('Setting up YouTube client...');

    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });

    // Form a search query for YouTube
    const query = `${title} ${artist} official music video`;
    console.log('Searching for:', query);

    // Search for the video using the YouTube Data API
    const searchResponse = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['video'],
      maxResults: 1,
      videoEmbeddable: 'true',
    });

    console.log('Search response received:', searchResponse.data);

    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      console.log('No videos found');
      return Response.json({ videoId: '' });
    }

    const videoId = searchResponse.data.items[0].id?.videoId || '';
    console.log('Video ID found:', videoId);
    return Response.json({ videoId });
  } catch (error) {
    console.error('Full error:', error);

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
      { status: 500 }
    );
  }
}
