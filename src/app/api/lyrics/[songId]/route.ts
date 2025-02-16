import { NextRequest } from 'next/server';

import Genius from 'genius-lyrics';
import { StatusCodes } from 'http-status-codes';

const Client = new Genius.Client(process.env.GENIUS_API_KEY || '');

export async function GET(
  _request: NextRequest,
  { params }: { params: { songId: string } }
) {
  // See https://nextjs.org/docs/messages/sync-dynamic-apis#possible-ways-to-fix-it
  const { songId } = await params;

  try {
    const song = await Client.songs.get(parseInt(songId));
    console.log(song);

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
