import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface OnboardingReflectionProps {
  onComplete: (text: string) => void;
  isSubmitting: boolean;
  existingReflection?: string;
}

export function OnboardingReflection({ onComplete, isSubmitting, existingReflection }: OnboardingReflectionProps) {
  const [text, setText] = useState(existingReflection || '');
  const [saved, setSaved] = useState(!!existingReflection);

  const handleSave = () => {
    if (!text.trim()) return;
    setSaved(true);
    onComplete(text.trim());
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setSaved(false); }}
        placeholder="Type your thoughts here..."
        rows={4}
        className="border-amber-200 dark:border-amber-800 focus-visible:ring-amber-400"
      />
      {!saved && (
        <Button
          onClick={handleSave}
          disabled={!text.trim() || isSubmitting}
          size="sm"
          className="gap-1"
        >
          <Save className="h-4 w-4" /> Save My Reflection
        </Button>
      )}
      {saved && (
        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          ✓ Reflection saved
        </p>
      )}
    </div>
  );
}
