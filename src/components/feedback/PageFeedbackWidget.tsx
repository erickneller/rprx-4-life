import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useSubmitFeedback } from '@/hooks/usePageFeedback';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquarePlus, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function PageFeedbackWidget() {
  const { enabled } = useFeatureFlag('test_mode');
  const location = useLocation();
  const submitFeedback = useSubmitFeedback();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');

  if (!enabled) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    try {
      await submitFeedback.mutateAsync({
        page_route: location.pathname,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success('Thanks for your feedback!');
      setRating(0);
      setComment('');
      setOpen(false);
    } catch (e: any) {
      console.error('[feedback] submit failed', e);
      toast.error(e?.message ? `Failed: ${e.message}` : 'Failed to submit feedback');
    }
  };

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                aria-label="Submit page feedback"
                className="fixed bottom-6 left-6 z-50 h-12 w-12 rounded-full shadow-lg bg-accent text-accent-foreground hover:bg-accent/80"
              >
                <MessageSquarePlus className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">Click to submit page specific feedback</TooltipContent>
        </Tooltip>
        <PopoverContent side="top" align="start" className="w-80">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Page Feedback</p>
            <p className="text-xs text-muted-foreground">{location.pathname}</p>
          </div>

          {/* Star rating */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="p-0.5 transition-colors"
              >
                <Star
                  className={cn(
                    'h-6 w-6 transition-colors',
                    (hoveredStar || rating) >= star
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  )}
                />
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Optional comment (max 500 chars)"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            className="min-h-[60px] text-sm"
          />

          <Button
            size="sm"
            className="w-full"
            onClick={handleSubmit}
            disabled={submitFeedback.isPending}
          >
            {submitFeedback.isPending ? 'Submitting…' : 'Submit Feedback'}
          </Button>
        </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
