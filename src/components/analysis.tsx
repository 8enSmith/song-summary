import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from './loading-spinner';
import { Button } from '@/components/ui/button';

interface AnalysisProps {
  analysis?: string;
  isLoading: boolean;
}

export const Analysis = ({ analysis, isLoading }: AnalysisProps) => {
  const [isReading, setIsReading] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handleReadAloud = async () => {
    if (!analysis || isReading) return;
    
    try {
      setIsReading(true);
      
      // Call ElevenLabs API to convert text to speech
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: analysis }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Stop any currently playing audio
      if (audioElement) {
        audioElement.pause();
        audioElement.remove();
      }
      
      // Play the new audio
      const audio = new Audio(audioUrl);
      setAudioElement(audio);
      
      audio.onended = () => {
        setIsReading(false);
      };
      
      audio.onerror = () => {
        setIsReading(false);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error generating speech:', error);
      setIsReading(false);
    }
  };

  const stopReading = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsReading(false);
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-center text-white flex justify-between items-center">
          <span>Analysis</span>
          {analysis && !isLoading && (
            isReading ? (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={stopReading}
                className="flex items-center gap-2"
              >
                <span>Stop Reading</span>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect 
                    x="6" 
                    y="6" 
                    width="12" 
                    height="12" 
                    fill="white" 
                  />
                </svg>
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReadAloud}
                className="flex items-center gap-2"
              >
                <span className="text-black">Read Aloud</span>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M8 5.14v14l11-7-11-7z" 
                    fill="black" 
                  />
                </svg>
              </Button>
            )
          )}
        </CardTitle>
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
