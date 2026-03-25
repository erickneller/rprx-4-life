import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFeatureFlag, useToggleFeatureFlag } from '@/hooks/useFeatureFlag';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';

export function FeaturesTab() {
  const { enabled, isLoading } = useFeatureFlag('chat_enabled');
  const toggle = useToggleFeatureFlag('chat_enabled');
  const { enabled: testModeEnabled, isLoading: testModeLoading } = useFeatureFlag('test_mode');
  const testModeToggle = useToggleFeatureFlag('test_mode');

  const handleToggle = async (checked: boolean) => {
    try {
      await toggle.mutateAsync(checked);
      toast.success(checked ? 'AI Chat enabled' : 'AI Chat disabled');
    } catch {
      toast.error('Failed to update feature flag');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            AI Chat Assistant
          </CardTitle>
          <CardDescription>
            Enable or disable the Strategy Assistant chat across the entire app. When disabled, the chat FAB, sidebar link, and help drawer CTA will be hidden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              id="chat-toggle"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={isLoading || toggle.isPending}
            />
            <Label htmlFor="chat-toggle">
              {enabled ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
