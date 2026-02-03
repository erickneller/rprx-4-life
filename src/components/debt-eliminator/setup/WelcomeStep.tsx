import { Button } from "@/components/ui/button";
import { Target, ArrowRight, Sparkles } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-8 py-8">
      <div className="relative">
        <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full" />
        <div className="relative bg-gradient-to-br from-accent to-accent/80 p-6 rounded-full">
          <Target className="h-16 w-16 text-accent-foreground" />
        </div>
      </div>

      <div className="space-y-4 max-w-md">
        <h1 className="text-3xl font-bold text-foreground">
          RPRx Rapid Debt Eliminator
        </h1>
        <p className="text-lg text-muted-foreground">
          Transform your debt payoff journey into an engaging experience. Track
          your progress, earn badges, and watch your financial freedom become
          reality.
        </p>
      </div>

      <div className="grid gap-4 text-left max-w-sm w-full">
        {[
          { icon: "📊", text: "Track multiple debts in one place" },
          { icon: "🎯", text: "Set your dream and stay motivated" },
          { icon: "🏆", text: "Earn badges as you hit milestones" },
          { icon: "💰", text: "See interest & time you're saving" },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-sm text-foreground">{item.text}</span>
          </div>
        ))}
      </div>

      <Button
        size="lg"
        onClick={onNext}
        className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
      >
        <Sparkles className="h-5 w-5" />
        Start Your Journey
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
