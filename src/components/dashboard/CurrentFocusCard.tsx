import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight } from 'lucide-react';

interface CurrentFocusCardProps {
  focusName: string;
  description: string;
  progressPercent: number;
  onContinue?: () => void;
}

export function CurrentFocusCard({
  focusName,
  description,
  progressPercent,
  onContinue,
}: CurrentFocusCardProps) {
  return (
    <Card className="border-2 border-primary/30 bg-card shadow-md">
      <CardHeader className="pb-2 px-8 pt-8">
        <CardTitle className="text-lg text-muted-foreground font-medium tracking-wide uppercase">
          My Current Focus
        </CardTitle>
      </CardHeader>
      <CardContent className="px-8 pb-8 space-y-4">
        <div>
          <p className="text-xl font-bold text-foreground">{focusName}</p>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <Button className="mt-2 bg-green-600 hover:bg-green-700 text-white" onClick={onContinue}>
          Continue Focus
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
