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

  const items = searches.map(({ id, title, artist: { name } }) => ({
    id: id.toString(),
    title,
    artist: name,
    value: id.toString(),
    label: `${title} - ${name}`
  }));

  return Response.json({ items });
}
