import { useQuery } from '@tanstack/react-query';

interface SuggestedSong {
  id: string;
  title: string;
  artist: {
    name: string;
  };
  album: {
    cover_big: string;
  };
}

interface SearchResponse {
  data: SuggestedSong[];
  total: number;
  next: string;
}

interface SongLyrics {
  lyrics: string;
}

export const useSongSearch = (query: string) => {
  return useQuery<{
    items: Array<{
      id: string;
      title: string;
      artist: string;
      albumCover: string;
    }>;
  }>({
    queryKey: ['songs', query],
    queryFn: async () => {
      if (!query) return { items: [] };
      const res = await fetch(
        `https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`
      );
      const data: SearchResponse = await res.json();
      console.log(data);
      return {
        items: data.data.map((song) => ({
          id: `${song.artist.name}___${song.title}`,
          title: song.title,
          artist: song.artist.name,
          value: `${song.artist.name}___${song.title}`,
          label: `${song.title} - ${song.artist.name}`,
          albumCover: song.album.cover_big,
        })),
      };
    },
    enabled: query.length > 0,
  });
};

export const useSongLyrics = (songId: string) => {
  return useQuery<SongLyrics>({
    queryKey: ['lyrics', songId],
    queryFn: async () => {
      if (!songId) return { lyrics: '' };
      const [artist, title] = songId.split('___');
      if (!artist || !title) return { lyrics: '' };

      const res = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
      );
      return res.json();
    },
    enabled: !!songId,
  });
};

export const useLyricsAnalysis = (lyrics: string) => {
  return useQuery({
    queryKey: ['lyrics-analysis', lyrics],
    queryFn: async () => {
      if (!lyrics) return { analysis: '' };
      const res = await fetch('/api/lyrics/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lyrics }),
      });
      const data = await res.json();
      return data;
    },
    enabled: !!lyrics,
  });
};

export const useVideoId = (songId: string, title?: string, artist?: string) => {
  return useQuery({
    queryKey: ['video', songId],
    queryFn: async () => {
      if (!songId) return { videoId: '' };
      // Extract artist and title from songId since they're encoded in it
      const [artistFromId, titleFromId] = songId.split('___');
      const finalArtist = artist || artistFromId;
      const finalTitle = title || titleFromId;

      if (!finalArtist || !finalTitle) return { videoId: '' };

      const res = await fetch(
        `/api/lyrics/${songId}/video?title=${encodeURIComponent(finalTitle)}&artist=${encodeURIComponent(finalArtist)}`
      );
      return res.json();
    },
    enabled: !!songId,
  });
};
