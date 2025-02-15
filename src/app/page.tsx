'use client';

import { useState } from 'react';

import Image from 'next/image';

import { AutoComplete } from '@/components/autocomplete';

import {
  useLyricsAnalysis,
  useSongLyrics,
  useSongSearch,
  useVideoId,
} from '@/lib/hooks/use-song-search';

export default function SearchPage() {
  const [selectedSong, setSelectedSong] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading } = useSongSearch(searchQuery);
  const { data: lyricsData, isLoading: isLoadingLyrics } =
    useSongLyrics(selectedSong);
  const { data: analysisData, isLoading: isLoadingAnalysis } =
    useLyricsAnalysis(lyricsData?.lyrics || '');

  const selectedSongData = data?.items?.find(
    (song) => song.id === selectedSong
  );
  const { data: videoData } = useVideoId(
    selectedSong,
    selectedSongData?.title,
    selectedSongData?.artist
  );

  const formattedItems =
    data?.items?.map((song) => ({
      value: song.id,
      label: `${song.title} - ${song.artist}`,
    })) ?? [];

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl relative">
        <h1 className="text-7xl font-extrabold text-white mb-8 text-center tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 transition-all duration-300 hover:scale-105 hover:from-white hover:to-blue-300">
          Song Summary
        </h1>
        <AutoComplete
          selectedValue={selectedSong}
          onSelectedValueChange={setSelectedSong}
          searchValue={searchQuery}
          onSearchValueChange={setSearchQuery}
          items={formattedItems}
          placeholder="Search for songs..."
          emptyMessage={isLoading ? 'Loading...' : 'No songs found.'}
        />

        {selectedSong && videoData?.videoId && (
          <div className="mt-8">
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
              <div className="relative pb-[56.25%] h-0">
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-md"
                  src={`https://www.youtube.com/embed/${videoData.videoId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}

        {selectedSong && (
          <div className="mt-8 grid grid-cols-2 gap-6">
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 text-center">
                Lyrics
              </h2>
              {isLoadingLyrics ? (
                <div className="text-gray-400 text-center">
                  Loading lyrics...
                </div>
              ) : lyricsData?.lyrics ? (
                <div className="text-gray-200 whitespace-pre-line prose prose-invert prose-sm">
                  {lyricsData.lyrics}
                </div>
              ) : (
                <div className="text-gray-400 text-center">No lyrics found</div>
              )}
            </div>

            <div className="flex flex-col space-y-6">
              {lyricsData?.thumbnail && (
                <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 text-center">
                    Album Art
                  </h2>
                  <Image
                    src={lyricsData.thumbnail}
                    alt="Album Art"
                    width={500}
                    height={500}
                    className="w-full h-auto rounded-md"
                  />
                </div>
              )}
              <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
                <h2 className="text-xl font-semibold text-white mb-4 text-center">
                  Analysis
                </h2>
                {isLoadingAnalysis ? (
                  <div className="text-gray-400 text-center">
                    Analyzing lyrics...
                  </div>
                ) : analysisData?.analysis ? (
                  <div className="text-gray-200 whitespace-pre-line prose prose-invert prose-sm">
                    {analysisData.analysis}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center">
                    No analysis available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
