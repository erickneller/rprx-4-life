import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFeatureFlag, useToggleFeatureFlag } from '@/hooks/useFeatureFlag';
import { useAdvisorLink, useUpdateAdvisorLink } from '@/hooks/useAdvisorLink';
import { useAdvisorEmbed, useUpdateAdvisorEmbed } from '@/hooks/useAdvisorEmbed';
import { useBookingUrl, useUpdateBookingUrl } from '@/hooks/useBookingUrl';
import { toast } from 'sonner';
import { MessageSquare, FlaskConical, Phone, Code2, CalendarCheck } from 'lucide-react';

export function FeaturesTab() {
  const { enabled, isLoading } = useFeatureFlag('chat_enabled');
  const toggle = useToggleFeatureFlag('chat_enabled');
  const { enabled: testModeEnabled, isLoading: testModeLoading } = useFeatureFlag('test_mode');
  const testModeToggle = useToggleFeatureFlag('test_mode');

  const { enabled: advisorEnabled, url: advisorUrl, isLoading: advisorLoading } = useAdvisorLink();
  const advisorUpdate = useUpdateAdvisorLink();
  const [advisorInput, setAdvisorInput] = useState('');

  const { embed: advisorEmbedValue, isLoading: embedLoading } = useAdvisorEmbed();
  const embedUpdate = useUpdateAdvisorEmbed();
  const [embedInput, setEmbedInput] = useState('');

  const { url: bookingUrl, isLoading: bookingLoading } = useBookingUrl();
  const bookingUpdate = useUpdateBookingUrl();
  const [bookingInput, setBookingInput] = useState('');
  useEffect(() => { setBookingInput(bookingUrl); }, [bookingUrl]);

  useEffect(() => {
    setAdvisorInput(advisorUrl);
  }, [advisorUrl]);

  useEffect(() => {
    setEmbedInput(advisorEmbedValue);
  }, [advisorEmbedValue]);

  const handleEmbedSave = async () => {
    try {
      await embedUpdate.mutateAsync(embedInput);
      toast.success('Virtual Advisor embed updated');
    } catch {
      toast.error('Failed to save embed code');
    }
  };

  const handleToggle = async (checked: boolean) => {
    try {
      await toggle.mutateAsync(checked);
      toast.success(checked ? 'AI Chat enabled' : 'AI Chat disabled');
    } catch {
      toast.error('Failed to update feature flag');
    }
  };

  const handleAdvisorToggle = async (checked: boolean) => {
    try {
      await advisorUpdate.mutateAsync({ enabled: checked });
      toast.success(checked ? 'Advisor link enabled' : 'Advisor link disabled');
    } catch {
      toast.error('Failed to update advisor link');
    }
  };

  const handleAdvisorSave = async () => {
    try {
      await advisorUpdate.mutateAsync({ value: advisorInput });
      toast.success('Advisor link updated');
    } catch {
      toast.error('Failed to save advisor link');
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Test Mode / Page Feedback
          </CardTitle>
          <CardDescription>
            When enabled, a feedback widget appears on all pages for users to rate and comment. Use during testing or when rolling out new features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              id="test-mode-toggle"
              checked={testModeEnabled}
              onCheckedChange={async (checked) => {
                try {
                  await testModeToggle.mutateAsync(checked);
                  toast.success(checked ? 'Test Mode enabled' : 'Test Mode disabled');
                } catch {
                  toast.error('Failed to update test mode');
                }
              }}
              disabled={testModeLoading || testModeToggle.isPending}
            />
            <Label htmlFor="test-mode-toggle">
              {testModeEnabled ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            RPRx Advisor Link
          </CardTitle>
          <CardDescription>
            Configure the "Speak with an RPRx Advisor" CTA shown in the sidebar and dashboard. Enter a URL (e.g. Calendly link) or a phone number (auto-formatted as a tel: link).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="advisor-toggle"
              checked={advisorEnabled}
              onCheckedChange={handleAdvisorToggle}
              disabled={advisorLoading || advisorUpdate.isPending}
            />
            <Label htmlFor="advisor-toggle">
              {advisorEnabled ? 'Visible' : 'Hidden'}
            </Label>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="https://calendly.com/... or (555) 123-4567"
              value={advisorInput}
              onChange={(e) => setAdvisorInput(e.target.value)}
            />
            <Button
              onClick={handleAdvisorSave}
              disabled={advisorUpdate.isPending || advisorInput === advisorUrl}
            >
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Virtual Advisor Embed
          </CardTitle>
          <CardDescription>
            Paste the embed snippet (e.g. LeadConnector chat widget) to display on the /virtual-advisor page. Scripts run in users' browsers — only paste trusted code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={embedInput}
            onChange={(e) => setEmbedInput(e.target.value)}
            placeholder={`<script src="https://beta.leadconnectorhq.com/loader.js" data-resources-url="https://beta.leadconnectorhq.com/chat-widget/loader.js" data-widget-id="..."></script>`}
            rows={8}
            className="font-mono text-xs"
            disabled={embedLoading}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleEmbedSave}
              disabled={embedUpdate.isPending || embedInput === advisorEmbedValue}
            >
              Save Embed
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Physical Health Advisor Booking URL
          </CardTitle>
          <CardDescription>
            URL used by the "Book My RPRx Physical Health Advisor Call" button on the Physical Health Snapshot report.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="https://calendly.com/..."
              value={bookingInput}
              onChange={(e) => setBookingInput(e.target.value)}
              disabled={bookingLoading}
            />
            <Button
              onClick={async () => {
                try { await bookingUpdate.mutateAsync(bookingInput); toast.success('Booking URL updated'); }
                catch { toast.error('Failed to save booking URL'); }
              }}
              disabled={bookingUpdate.isPending || bookingInput === bookingUrl}
            >
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
