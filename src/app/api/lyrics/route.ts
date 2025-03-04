import { NextRequest } from 'next/server';

import { StatusCodes } from 'http-status-codes';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return Response.json({ items: [] }, { status: StatusCodes.OK });
  }

  try {
    const res = await fetch(
      `https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`
    );
    const data = await res.json();

    const items = data.data.map(
      (song: { title: string; artist: { name: string } }) => ({
        id: `${song.artist.name}___${song.title}`,
        title: song.title,
        artist: song.artist.name,
        value: `${song.artist.name}___${song.title}`,
        label: `${song.title} - ${song.artist.name}`,
      })
    );

    return Response.json({ items });
  } catch (error) {
    console.error('Error searching songs:', error);
    return Response.json(
      { error: 'Failed to search songs' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
