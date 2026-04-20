import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { useAdvisorLink } from '@/hooks/useAdvisorLink';

function resolveHref(url: string): string {
  const digits = url.replace(/\D/g, '');
  if (digits.length >= 10 && !/^https?:\/\//i.test(url)) {
    return `tel:+1${digits.slice(-10)}`;
  }
  return url;
}

export function AdvisorCTACard() {
  const { enabled, url } = useAdvisorLink();

  if (!enabled || !url) return null;

  const href = resolveHref(url);
  const isPhone = href.startsWith('tel:');

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="rounded-full bg-primary/10 p-3">
          <Phone className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">Speak with an RPRx Advisor</h3>
          <p className="text-sm text-muted-foreground">Get personalized guidance from a financial advisor</p>
        </div>
        <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <a href={href} target={isPhone ? undefined : '_blank'} rel="noopener noreferrer">
            {isPhone ? 'Call Now' : 'Book Now'}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
