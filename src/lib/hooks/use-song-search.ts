import { useQuery } from '@tanstack/react-query';

interface Song {
  id: string;
  title: string;
  artist: string;
}

interface SongLyrics {
  lyrics: string;
  thumbnail: string;
}

export function useSongSearch(query: string) {
  return useQuery<{ items: Song[] }>({
    queryKey: ['songs', query],
    queryFn: async () => {
      if (!query) return { items: [] };
      const res = await fetch(`/api/lyrics?q=${encodeURIComponent(query)}`);
      return res.json();
    },
    enabled: query.length > 0,
  });
}

export function useSongLyrics(songId: string) {
  return useQuery<SongLyrics>({
    queryKey: ['lyrics', songId],
    queryFn: async () => {
      if (!songId) return { lyrics: '' };
      const res = await fetch(`/api/lyrics/${songId}`);
      return res.json();
    },
    enabled: !!songId,
  });
}

export function useLyricsAnalysis(lyrics: string) {
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
}

export function useVideoId(songId: string, title?: string, artist?: string) {
  return useQuery({
    queryKey: ['video', songId],
    queryFn: async () => {
      if (!songId || !title || !artist) return { videoId: '' };
      const res = await fetch(
        `/api/lyrics/${songId}/video?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`
      );
      return res.json();
    },
    enabled: !!songId && !!title && !!artist,
  });
}
