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
import { MessageSquare, FlaskConical, Phone, Code2, CalendarCheck, Gauge, Route, CreditCard } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFirstLoginFlow, useSetFirstLoginFlow } from '@/hooks/useFirstLoginFlow';
import { FIRST_LOGIN_FLOW_OPTIONS, type FirstLoginFlowPreset } from '@/lib/firstLoginFlow';
import { useBillingCardSettings, useSetBillingCardSettings, DEFAULT_BILLING_CARD_COPY, type BillingCardCopy } from '@/hooks/useBillingCardSettings';

export function FeaturesTab() {
  const { enabled, isLoading } = useFeatureFlag('chat_enabled');
  const toggle = useToggleFeatureFlag('chat_enabled');
  const { enabled: testModeEnabled, isLoading: testModeLoading } = useFeatureFlag('test_mode');
  const testModeToggle = useToggleFeatureFlag('test_mode');

  const { enabled: rprxScoreVisible, isLoading: rprxScoreLoading } = useFeatureFlag('rprx_score_visible');
  const rprxScoreToggle = useToggleFeatureFlag('rprx_score_visible');
  const { enabled: xpScoreVisible, isLoading: xpScoreLoading } = useFeatureFlag('xp_score_visible');
  const xpScoreToggle = useToggleFeatureFlag('xp_score_visible');
  const { enabled: streakVisible, isLoading: streakLoading } = useFeatureFlag('streak_visible');
  const streakToggle = useToggleFeatureFlag('streak_visible');
  const { enabled: personalizedStrategyVisible, isLoading: personalizedStrategyLoading } = useFeatureFlag('personalized_strategy_visible');
  const personalizedStrategyToggle = useToggleFeatureFlag('personalized_strategy_visible');


  const { preset: firstLoginPreset, isLoading: firstLoginLoading } = useFirstLoginFlow();
  const firstLoginSet = useSetFirstLoginFlow();

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

  const { enabled: billingEnabled, copy: billingCopy, isLoading: billingLoading } = useBillingCardSettings();
  const billingSet = useSetBillingCardSettings();
  const [billingDraft, setBillingDraft] = useState<BillingCardCopy>(DEFAULT_BILLING_CARD_COPY);
  useEffect(() => { setBillingDraft(billingCopy); }, [billingCopy]);
  const billingDirty = JSON.stringify(billingDraft) !== JSON.stringify(billingCopy);

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
            <Route className="h-5 w-5" />
            First-Login Flow
          </CardTitle>
          <CardDescription>
            Choose where new users are sent after signing in for the first time, and what they must complete before reaching the dashboard. Phone capture is always required for Google sign-ups.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={firstLoginPreset}
            onValueChange={async (value) => {
              try {
                await firstLoginSet.mutateAsync(value as FirstLoginFlowPreset);
                toast.success('First-login flow updated');
              } catch {
                toast.error('Failed to update flow');
              }
            }}
            disabled={firstLoginLoading || firstLoginSet.isPending}
            className="space-y-3"
          >
            {FIRST_LOGIN_FLOW_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                htmlFor={`flow-${opt.value}`}
                className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem value={opt.value} id={`flow-${opt.value}`} className="mt-0.5" />
                <div className="space-y-1">
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.description}</div>
                </div>
              </label>
            ))}
          </RadioGroup>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Score Visibility
          </CardTitle>
          <CardDescription>
            Independently show or hide the RPRx Score and XP Score across the sidebar, dashboard streak bar, and Gamification card.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="rprx-score-toggle" className="flex flex-col">
              <span className="font-medium">RPRx Score</span>
              <span className="text-xs text-muted-foreground">Financial wellness ring (0–100) and pillar breakdown</span>
            </Label>
            <Switch
              id="rprx-score-toggle"
              checked={rprxScoreVisible}
              onCheckedChange={async (checked) => {
                try {
                  await rprxScoreToggle.mutateAsync(checked);
                  toast.success(checked ? 'RPRx Score visible' : 'RPRx Score hidden');
                } catch {
                  toast.error('Failed to update RPRx Score visibility');
                }
              }}
              disabled={rprxScoreLoading || rprxScoreToggle.isPending}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="xp-score-toggle" className="flex flex-col">
              <span className="font-medium">XP Score</span>
              <span className="text-xs text-muted-foreground">Engagement points total displayed in the streak bar and sidebar</span>
            </Label>
            <Switch
              id="xp-score-toggle"
              checked={xpScoreVisible}
              onCheckedChange={async (checked) => {
                try {
                  await xpScoreToggle.mutateAsync(checked);
                  toast.success(checked ? 'XP Score visible' : 'XP Score hidden');
                } catch {
                  toast.error('Failed to update XP Score visibility');
                }
              }}
              disabled={xpScoreLoading || xpScoreToggle.isPending}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="streak-toggle" className="flex flex-col">
              <span className="font-medium">Day Streak</span>
              <span className="text-xs text-muted-foreground">Flame indicator showing consecutive active days</span>
            </Label>
            <Switch
              id="streak-toggle"
              checked={streakVisible}
              onCheckedChange={async (checked) => {
                try {
                  await streakToggle.mutateAsync(checked);
                  toast.success(checked ? 'Day Streak visible' : 'Day Streak hidden');
                } catch {
                  toast.error('Failed to update Day Streak visibility');
                }
              }}
              disabled={streakLoading || streakToggle.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="personalized-strategy-toggle" className="flex flex-col">
              <span className="font-medium">Personalized Strategy Card</span>
              <span className="text-xs text-muted-foreground">"Your Personalized Strategy" CTA on the assessment results page. Turn off when not using the internal strategy engine.</span>
            </Label>
            <Switch
              id="personalized-strategy-toggle"
              checked={personalizedStrategyVisible}
              onCheckedChange={async (checked) => {
                try {
                  await personalizedStrategyToggle.mutateAsync(checked);
                  toast.success(checked ? 'Personalized Strategy card visible' : 'Personalized Strategy card hidden');
                } catch {
                  toast.error('Failed to update visibility');
                }
              }}
              disabled={personalizedStrategyLoading || personalizedStrategyToggle.isPending}
            />
          </div>

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Card (Profile)
          </CardTitle>
          <CardDescription>
            Show or hide the Billing & Subscription card on the user Profile page, and edit its copy. Use <code>{'{email}'}</code> in the footer note to insert the support email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="billing-card-toggle"
              checked={billingEnabled}
              onCheckedChange={async (checked) => {
                try {
                  await billingSet.mutateAsync({ enabled: checked });
                  toast.success(checked ? 'Billing card visible' : 'Billing card hidden');
                } catch {
                  toast.error('Failed to update visibility');
                }
              }}
              disabled={billingLoading || billingSet.isPending}
            />
            <Label htmlFor="billing-card-toggle">
              {billingEnabled ? 'Visible on Profile' : 'Hidden from Profile'}
            </Label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bc-title">Title</Label>
              <Input id="bc-title" value={billingDraft.title} onChange={(e) => setBillingDraft({ ...billingDraft, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bc-desc">Description</Label>
              <Input id="bc-desc" value={billingDraft.description} onChange={(e) => setBillingDraft({ ...billingDraft, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bc-upgrade">Upgrade button (Free users)</Label>
              <Input id="bc-upgrade" value={billingDraft.upgradeLabel} onChange={(e) => setBillingDraft({ ...billingDraft, upgradeLabel: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bc-change">Change button (paid users)</Label>
              <Input id="bc-change" value={billingDraft.changeLabel} onChange={(e) => setBillingDraft({ ...billingDraft, changeLabel: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bc-support">Support button label</Label>
              <Input id="bc-support" value={billingDraft.supportLabel} onChange={(e) => setBillingDraft({ ...billingDraft, supportLabel: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bc-email">Support email</Label>
              <Input id="bc-email" type="email" value={billingDraft.supportEmail} onChange={(e) => setBillingDraft({ ...billingDraft, supportEmail: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bc-footer">Footer note</Label>
            <Textarea
              id="bc-footer"
              rows={2}
              value={billingDraft.footerNote}
              onChange={(e) => setBillingDraft({ ...billingDraft, footerNote: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Use <code>{'{email}'}</code> to insert the support email as a clickable link.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setBillingDraft(DEFAULT_BILLING_CARD_COPY)}
              disabled={billingSet.isPending}
            >
              Reset to defaults
            </Button>
            <Button
              onClick={async () => {
                try {
                  await billingSet.mutateAsync({ copy: billingDraft });
                  toast.success('Billing card copy updated');
                } catch {
                  toast.error('Failed to save copy');
                }
              }}
              disabled={!billingDirty || billingSet.isPending}
            >
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
