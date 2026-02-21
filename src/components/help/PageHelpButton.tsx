import { useState, useEffect } from 'react';
import { HelpCircle, X, Play } from 'lucide-react';
import { usePageHelp } from '@/hooks/usePageHelp';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';

const STORAGE_KEY = 'help_hints_dismissed';
const CLICKED_KEY = 'help_clicked_pages';

function getDismissedPages(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function dismissPage(pageId: string) {
  const dismissed = getDismissedPages();
  if (!dismissed.includes(pageId)) {
    dismissed.push(pageId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
  }
}

function getClickedPages(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CLICKED_KEY) || '[]');
  } catch {
    return [];
  }
}

function markPageClicked(pageId: string) {
  const clicked = getClickedPages();
  if (!clicked.includes(pageId)) {
    clicked.push(pageId);
    localStorage.setItem(CLICKED_KEY, JSON.stringify(clicked));
  }
}

function isVideoEmbed(url: string) {
  return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
}

function getEmbedUrl(url: string): string {
  if (url.includes('youtube.com/watch')) {
    const id = new URL(url).searchParams.get('v');
    return `https://www.youtube.com/embed/${id}`;
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  if (url.includes('vimeo.com/')) {
    const id = url.split('vimeo.com/')[1]?.split('?')[0];
    return `https://player.vimeo.com/video/${id}`;
  }
  return url;
}

export function PageHelpButton() {
  const { helpContent, pageId } = usePageHelp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(true);
  const [glowActive, setGlowActive] = useState(false);

  useEffect(() => {
    if (pageId) {
      setHintDismissed(getDismissedPages().includes(pageId));
      setGlowActive(!getClickedPages().includes(pageId));
    }
  }, [pageId]);

  if (!helpContent) return null;

  const handleDismissHint = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pageId) {
      dismissPage(pageId);
      setHintDismissed(true);
    }
  };

  return (
    <>
      {/* Floating button + hint */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        {!hintDismissed && (
          <div className="hidden sm:flex items-center gap-1 bg-background shadow-md rounded-full px-4 py-2 text-sm border animate-in slide-in-from-right-4 duration-300">
            <span className="text-muted-foreground">{helpContent.hint_text} →</span>
            <button
              onClick={handleDismissHint}
              className="ml-1 text-muted-foreground/60 hover:text-foreground transition-colors"
              aria-label="Dismiss hint"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <Button
          variant="outline"
          size="icon"
          className={`h-[52px] w-[52px] rounded-full shadow-lg bg-amber-400 hover:bg-amber-500 text-white border-none transition-transform hover:scale-105 ${glowActive ? 'animate-[helpGlow_2s_ease-in-out_infinite]' : ''}`}
          onClick={() => {
            if (pageId) {
              markPageClicked(pageId);
              setGlowActive(false);
            }
            setDrawerOpen(true);
          }}
          aria-label="Page help"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>

      {/* Help drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle className="text-xl">{helpContent.help_title}</SheetTitle>
            <SheetDescription className="sr-only">Help content for this page</SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 px-6 pb-6">
            {/* Video section */}
            <div className="mb-4">
              <AspectRatio ratio={16 / 9}>
                {helpContent.video_url ? (
                  isVideoEmbed(helpContent.video_url) ? (
                    <iframe
                      src={getEmbedUrl(helpContent.video_url)}
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={helpContent.video_url}
                      controls
                      className="w-full h-full rounded-lg object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full rounded-lg bg-muted flex flex-col items-center justify-center gap-2">
                    <Play className="h-10 w-10 text-muted-foreground/40" />
                    <span className="text-sm text-muted-foreground">{helpContent.video_placeholder_text}</span>
                  </div>
                )}
              </AspectRatio>
            </div>

            {/* Markdown body */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{helpContent.help_body}</ReactMarkdown>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
