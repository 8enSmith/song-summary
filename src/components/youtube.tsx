import { Card, CardContent } from "@/components/ui/card";

interface YouTubeProps {
  videoId: string;
}

export function YouTube({ videoId }: YouTubeProps) {
  if (!videoId) return null;

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardContent className="p-6">
        <div className="relative pb-[56.25%] h-0">
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-md"
            src={`https://www.youtube.com/embed/${videoId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </CardContent>
    </Card>
  );
}