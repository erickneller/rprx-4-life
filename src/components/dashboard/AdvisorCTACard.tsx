import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdvisorLink } from '@/hooks/useAdvisorLink';

export function AdvisorCTACard() {
  const { enabled } = useAdvisorLink();

  if (!enabled) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="rounded-full bg-primary/10 p-3">
          <Phone className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">Speak With A Virtual Advisor</h3>
          <p className="text-sm text-muted-foreground">Get personalized guidance from a financial advisor</p>
        </div>
        <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link to="/virtual-advisor">Open Advisor</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
