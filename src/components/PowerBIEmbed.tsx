'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface PowerBIEmbedProps {
  reportId: string;
  embedUrl?: string;           // Optional: Direct embed URL
  height?: string;
  title?: string;
  showHeader?: boolean;
}

export default function PowerBIEmbed({
  reportId,
  embedUrl,
  height = "600px",
  title = "Power BI Dashboard",
  showHeader = true,
}: PowerBIEmbedProps) {
  const embedRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [reportId, embedUrl]);

  // If no reportId is provided
  if (!reportId && !embedUrl) {
    return (
      <Card>
        <CardContent className="h-[400px] flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="font-medium">No Power BI Report Configured</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please provide a valid reportId or embedUrl
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {showHeader && (
        <div className="px-6 py-4 border-b bg-muted/50">
          <h3 className="font-semibold">{title}</h3>
        </div>
      )}

      <CardContent className="p-0">
        <div 
          ref={embedRef}
          className="relative w-full bg-white"
          style={{ height }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="space-y-3 w-full px-8">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-8 w-1/2" />
              </div>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-500">
              <div className="text-center">
                <AlertCircle className="h-10 w-10 mx-auto mb-2" />
                <p>{error}</p>
              </div>
            </div>
          ) : embedUrl ? (
            // Direct Embed URL (Recommended for PowerBI Service)
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              className="rounded-b-lg"
            />
          ) : (
            // Report ID based embed (fallback)
            <iframe
              src={`https://app.powerbi.com/reportEmbed?reportId=${reportId}&autoAuth=true&ctid=your-tenant-id`}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              className="rounded-b-lg"
              onError={() => setError("Failed to load Power BI report. Check report ID.")}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}