import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from './loading-spinner';

interface LyricsProps {
  lyrics?: string;
  isLoading: boolean;
}

export function Lyrics({ lyrics, isLoading }: LyricsProps) {
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-center text-white">Lyrics</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-gray-400 text-center flex items-center justify-center">
            <LoadingSpinner className="mr-2" />
            Loading lyrics...
          </div>
        ) : lyrics ? (
          <div className="text-gray-200 whitespace-pre-line prose prose-invert prose-sm">
            {lyrics}
          </div>
        ) : (
          <div className="text-gray-400 text-center">No lyrics found</div>
        )}
      </CardContent>
    </Card>
  );
}