import { NextRequest } from 'next/server';

import { StatusCodes } from 'http-status-codes';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ songId: string }> }
) {
  const { songId } = await params;
  const [artist, title] = songId.split('___');

  if (!artist || !title) {
    return Response.json(
      { error: 'Invalid song ID format' },
      { status: StatusCodes.BAD_REQUEST }
    );
  }

  try {
    const res = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
    );

    if (!res.ok) {
      return Response.json(
        { error: 'Lyrics not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    const data = await res.json();
    return Response.json({ lyrics: data.lyrics });
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return Response.json(
      { error: 'Failed to fetch lyrics' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
