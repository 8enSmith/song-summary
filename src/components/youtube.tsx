import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import Image from 'next/image';

interface YouTubeProps {
  videoId: string;
}

const StaticTVPlaceholder = ({ isVisible }: { isVisible: boolean }) => {
  return (
    <div className={`absolute inset-0 flex items-center justify-center bg-gray-900 rounded-md overflow-hidden transition-opacity duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
          <Image
            src="/no-signal.jpg"
            alt="No Signal"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <div className="text-white text-lg font-mono opacity-80 animate-pulse">
              Loading Video...
            </div>
      </div>
    </div>
  );
};

export function YouTube({ videoId }: YouTubeProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!videoId) return null;

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardContent className="p-6">
        <div className="relative pb-[56.25%] h-0">
          <StaticTVPlaceholder isVisible={!isLoaded} />
          <iframe
            className={`absolute top-0 left-0 w-full h-full rounded-md transition-opacity duration-1500 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            src={`https://www.youtube.com/embed/${videoId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleLoad}
          />
        </div>
      </CardContent>
    </Card>
  );
}
