import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Pencil, Plus } from "lucide-react";

interface MotivationCardProps {
  motivation: string | null;
  onEdit: () => void;
}

export function MotivationCard({ motivation, onEdit }: MotivationCardProps) {
  if (!motivation) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Sparkles className="h-5 w-5" />
              <span className="font-medium text-foreground">Your Motivation</span>
            </div>
          </div>
          <p className="text-muted-foreground mb-4">
            What's driving you? How will completing this plan help you and those closest to you?
          </p>
          <Button
            variant="outline"
            onClick={onEdit}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Motivation
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-accent mb-3">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium text-foreground">Your Motivation</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit motivation</span>
          </Button>
        </div>
        <p className="text-foreground italic text-lg leading-relaxed">
          "{motivation}"
        </p>
      </CardContent>
    </Card>
  );
}
