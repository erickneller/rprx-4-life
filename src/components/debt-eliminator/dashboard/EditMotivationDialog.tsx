import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";

interface EditMotivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMotivation: string;
  onSave: (newMotivation: string) => void;
  isLoading: boolean;
}

const MOTIVATION_PROMPTS = [
  "Take a dream vacation without worrying about money",
  "Buy a home for my family",
  "Start my own business",
  "Retire early and live comfortably",
  "Send my kids to college debt-free",
  "Finally feel financially free and at peace",
];

export function EditMotivationDialog({
  open,
  onOpenChange,
  currentMotivation,
  onSave,
  isLoading,
}: EditMotivationDialogProps) {
  const [motivation, setMotivation] = useState(currentMotivation);

  // Reset to current value when dialog opens
  useEffect(() => {
    if (open) {
      setMotivation(currentMotivation);
    }
  }, [open, currentMotivation]);

  const handleSave = () => {
    if (motivation.trim()) {
      onSave(motivation.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Edit Your Motivation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="motivation">
              Why do you want to be debt-free?
            </Label>
            <Textarea
              id="motivation"
              placeholder="When I'm debt-free, I will..."
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Inspiration prompts */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Need inspiration?</p>
            <div className="flex flex-wrap gap-2">
              {MOTIVATION_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setMotivation(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!motivation.trim() || isLoading}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Motivation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
