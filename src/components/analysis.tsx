import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from './loading-spinner';

interface AnalysisProps {
  analysis?: string;
  isLoading: boolean;
}

export function Analysis({ analysis, isLoading }: AnalysisProps) {
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-center text-white">Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-gray-400 text-center flex items-center justify-center">
            <LoadingSpinner className="mr-2" />
            Analyzing lyrics...
          </div>
        ) : analysis ? (
          <div className="text-gray-200 whitespace-pre-line prose prose-invert prose-sm">
            {analysis}
          </div>
        ) : (
          <div className="text-gray-400 text-center flex items-center justify-center">
            <LoadingSpinner className="mr-2" />
            Waiting for lyrics...
          </div>
        )}
      </CardContent>
    </Card>
  );
}