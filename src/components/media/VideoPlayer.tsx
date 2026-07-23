import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { resolveVideoSource } from '@/lib/videoSource';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  url: string | null | undefined;
  title: string;
  className?: string;
  ratio?: number;
}

const IFRAME_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture';

function Fallback({ url, title, message }: { url?: string | null; title: string; message: string }) {
  return (
    <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      {url && (
        <Button asChild size="sm" variant="default">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open video in new tab
          </a>
        </Button>
      )}
      <p className="text-xs text-muted-foreground/70 sr-only">{title}</p>
    </div>
  );
}

export function VideoPlayer({ url, title, className, ratio = 16 / 9 }: VideoPlayerProps) {
  const source = resolveVideoSource(url);
  const [failed, setFailed] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = false;
    setFailed(false);
    if (source.kind === 'unknown' || source.kind === 'file') return;
    const t = window.setTimeout(() => {
      if (!loadedRef.current) setFailed(true);
    }, 6000);
    return () => window.clearTimeout(t);
  }, [source.kind, (source as any).embedUrl, (source as any).src]);

  if (source.kind === 'unknown') {
    return (
      <AspectRatio ratio={ratio} className={cn('overflow-hidden rounded-md', className)}>
        <Fallback url={url} title={title} message="This video URL isn't a supported format (YouTube, Vimeo, Loom, Descript, or direct MP4)." />
      </AspectRatio>
    );
  }

  if (source.kind === 'file') {
    return (
      <AspectRatio ratio={ratio} className={className}>
        <video
          controls
          playsInline
          preload="metadata"
          className="w-full h-full object-contain bg-black"
        >
          <source src={source.src} />
          Your browser does not support video playback.
        </video>
      </AspectRatio>
    );
  }

  if (failed) {
    return (
      <AspectRatio ratio={ratio} className={cn('overflow-hidden rounded-md', className)}>
        <Fallback
          url={url}
          title={title}
          message="This video couldn't be embedded here. It may be set to private or restricted. Open it in a new tab to watch."
        />
      </AspectRatio>
    );
  }

  return (
    <AspectRatio ratio={ratio} className={className}>
      <iframe
        src={source.embedUrl}
        title={title}
        allow={IFRAME_ALLOW}
        allowFullScreen
        onLoad={() => { loadedRef.current = true; }}
        onError={() => setFailed(true)}
        className="w-full h-full border-0"
      />
    </AspectRatio>
  );
}
