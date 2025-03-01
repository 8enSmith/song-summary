import { NextRequest } from 'next/server';

import Genius from 'genius-lyrics';
import { StatusCodes } from 'http-status-codes';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ songId: string }> }
) {
  const { songId } = await params;

  try {
    const geniusClient = new Genius.Client(process.env.GENIUS_API_KEY || '');
    const song = await geniusClient.songs.get(parseInt(songId));

    if (!song) {
      return Response.json(
        { error: 'Song not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    const lyrics = await song.lyrics();
    return Response.json({ lyrics, thumbnail: song.thumbnail });
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return Response.json(
      { error: 'Failed to fetch lyrics' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
