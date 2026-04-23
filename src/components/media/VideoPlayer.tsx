import { AspectRatio } from '@/components/ui/aspect-ratio';
import { resolveVideoSource } from '@/lib/videoSource';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  url: string | null | undefined;
  title: string;
  className?: string;
  ratio?: number;
}

const IFRAME_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

export function VideoPlayer({ url, title, className, ratio = 16 / 9 }: VideoPlayerProps) {
  const source = resolveVideoSource(url);

  if (source.kind === 'unknown') {
    return (
      <AspectRatio ratio={ratio} className={cn('bg-muted flex items-center justify-center', className)}>
        <p className="text-sm text-muted-foreground px-4 text-center">
          Unsupported video URL
        </p>
      </AspectRatio>
    );
  }

  if (source.kind === 'file') {
    return (
      <AspectRatio ratio={ratio} className={className}>
        <video
          controls
          preload="metadata"
          className="w-full h-full object-contain bg-black"
        >
          <source src={source.src} />
          Your browser does not support video playback.
        </video>
      </AspectRatio>
    );
  }

  // YouTube or Loom — both render via iframe
  return (
    <AspectRatio ratio={ratio} className={className}>
      <iframe
        src={source.embedUrl}
        title={title}
        allow={IFRAME_ALLOW}
        allowFullScreen
        className="w-full h-full border-0"
      />
    </AspectRatio>
  );
}
