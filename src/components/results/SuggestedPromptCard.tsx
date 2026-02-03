import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateStrategyPrompt } from '@/lib/promptGenerator';
import type { HorsemanType } from '@/lib/scoringEngine';
import type { CashFlowStatus } from '@/lib/cashFlowCalculator';

interface SuggestedPromptCardProps {
  primaryHorseman: HorsemanType;
  cashFlowStatus: CashFlowStatus | null;
}

export function SuggestedPromptCard({
  primaryHorseman,
  cashFlowStatus,
}: SuggestedPromptCardProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const prompt = generateStrategyPrompt(primaryHorseman, cashFlowStatus);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Prompt copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please select and copy the text manually.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Get Personalized Guidance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Copy this prompt and paste it into the Strategy Assistant to get
          personalized recommendations:
        </p>
        <div className="rounded-md border bg-background p-3">
          <p className="text-sm italic text-foreground">"{prompt}"</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? 'Copied!' : 'Copy Prompt'}
          </Button>
          <Button
            className="flex-1"
            onClick={() => navigate('/strategy-assistant')}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Start Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
