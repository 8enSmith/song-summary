'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AutoComplete } from '@/components/autocomplete';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Lyrics } from '@/components/lyrics';
import { Analysis } from '@/components/analysis';
import { YouTube } from '@/components/youtube';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="w-full max-w-5xl relative">
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
            <YouTube videoId={videoData.videoId} />
          </div>
        )}

        {selectedSong && (
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Lyrics 
                lyrics={lyricsData?.lyrics}
                isLoading={isLoadingLyrics}
              />
              <Analysis
                analysis={analysisData?.analysis}
                isLoading={isLoadingAnalysis}
              />
            </div>

            {isLoadingLyrics ? (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-center text-white">Album Art</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-400 text-center flex items-center justify-center min-h-[200px]">
                    <LoadingSpinner className="mr-2" />
                    Loading album art...
                  </div>
                </CardContent>
              </Card>
            ) : (
              lyricsData?.thumbnail && (
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-center text-white">Album Art</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Image
                      src={lyricsData.thumbnail}
                      alt="Album Art"
                      width={500}
                      height={500}
                      className="w-full h-auto rounded-md"
                    />
                  </CardContent>
                </Card>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
