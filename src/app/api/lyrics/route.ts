import Genius from 'genius-lyrics';
import { NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return Response.json({ items: [] }, { status: StatusCodes.OK });
  }

  const Client = new Genius.Client(process.env.GENIUS_API_KEY || '');
  const searches = await Client.songs.search(query);

  const items = searches.map(song => ({
    id: song.id.toString(),
    title: song.title,
    artist: song.artist.name,
    value: song.id.toString(),
    label: `${song.title} - ${song.artist.name}`
  }));

  return Response.json({ items });
}
