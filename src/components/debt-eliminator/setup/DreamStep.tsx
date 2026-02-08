import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";

interface DreamStepProps {
  dreamText: string;
  onDreamChange: (text: string) => void;
  onComplete: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const DREAM_PROMPTS = [
  "Take a dream vacation without worrying about money",
  "Buy a home for my family",
  "Start my own business",
  "Retire early and live comfortably",
  "Send my kids to college debt-free",
  "Finally feel financially free and at peace",
];

export function DreamStep({
  dreamText,
  onDreamChange,
  onComplete,
  onBack,
  isLoading,
}: DreamStepProps) {
  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <div className="text-4xl">✨</div>
        <h2 className="text-2xl font-bold text-foreground">
          What's Your Motivation?
        </h2>
        <p className="text-muted-foreground">
          Describe what becoming debt-free means to you. This will keep you
          focused on your goal.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dream">Your Motivation</Label>
          <Textarea
            id="dream"
            placeholder="When I'm debt-free, I will..."
            value={dreamText}
            onChange={(e) => onDreamChange(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Inspiration prompts */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Need inspiration?</p>
          <div className="flex flex-wrap gap-2">
            {DREAM_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => onDreamChange(prompt)}
                className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onComplete}
          disabled={!dreamText.trim() || isLoading}
          className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Journey...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Start My Journey
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
