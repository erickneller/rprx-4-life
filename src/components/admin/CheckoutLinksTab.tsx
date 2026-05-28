import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCheckoutConfig,
  useUpdateCheckoutConfig,
  validateEmbedSnippet,
  type CheckoutConfig,
  type CheckoutSlot,
  type CheckoutMode,
} from '@/hooks/useCheckoutConfig';
import type { PlanKey, IntervalKey } from '@/lib/ghlCheckoutConfig';

const SLOTS: Array<{ plan: PlanKey; interval: IntervalKey; label: string }> = [
  { plan: 'partner', interval: 'month', label: 'Partner — Monthly' },
  { plan: 'partner', interval: 'year', label: 'Partner — Yearly' },
  { plan: 'pro', interval: 'month', label: 'Pro — Monthly' },
  { plan: 'pro', interval: 'year', label: 'Pro — Yearly' },
];

export function CheckoutLinksTab() {
  const { config, isLoading, isDefault, isError } = useCheckoutConfig();
  const update = useUpdateCheckoutConfig();
  const [draft, setDraft] = useState<CheckoutConfig | null>(null);

  useEffect(() => {
    if (config && !draft) setDraft(structuredClone(config));
  }, [config, draft]);

  if (isLoading || !draft) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const setSlot = (plan: PlanKey, interval: IntervalKey, slot: CheckoutSlot) => {
    setDraft((d) => (d ? { ...d, [plan]: { ...d[plan], [interval]: slot } } : d));
  };

  const handleSave = async () => {
    // Validate every embed snippet.
    for (const { plan, interval, label } of SLOTS) {
      const slot = draft[plan][interval];
      if (slot.mode === 'embed') {
        const err = validateEmbedSnippet(slot.value);
        if (err) {
          toast.error(`${label}: ${err}`);
          return;
        }
      }
    }
    try {
      await update.mutateAsync(draft);
      toast.success('Checkout links saved');
    } catch (e: any) {
      toast.error(e?.message ?? 'Save failed');
    }
  };

  return (
    <div className="space-y-6">
      {(isDefault || isError) && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="font-semibold text-destructive">Saved checkout config could not be loaded.</p>
          <p className="text-muted-foreground mt-1">
            The form below is showing the built-in defaults, not what's actually live. <strong>Do not click "Save all" yet</strong> — it will overwrite the live config. Refresh the page first; if the banner persists, check your network/RLS access to <code>feature_flags</code>.
          </p>
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Checkout Links</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Set the GoHighLevel checkout for each plan/interval. Paste a direct URL or a full
            GHL embed snippet (<code>&lt;iframe&gt;</code> + resize <code>&lt;script&gt;</code>).
            Only GHL domains are allowed in embed snippets.
          </p>
        </div>
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save all
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3 lg:col-span-2">
          <h3 className="font-semibold">Modal Header</h3>
          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input
              placeholder="Upgrade your plan"
              value={draft.header.title}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, header: { ...d.header, title: e.target.value } } : d))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea
              rows={2}
              placeholder="Shown under the title in the upgrade modal."
              value={draft.header.description}
              onChange={(e) =>
                setDraft((d) =>
                  d ? { ...d, header: { ...d.header, description: e.target.value } } : d,
                )
              }
            />
          </div>
        </Card>
        {SLOTS.map(({ plan, interval, label }) => {
          const slot = draft[plan][interval];
          return (
            <Card key={`${plan}-${interval}`} className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{label}</h3>
                <Tabs
                  value={slot.mode}
                  onValueChange={(v) => setSlot(plan, interval, { ...slot, mode: v as CheckoutMode })}
                >
                  <TabsList>
                    <TabsTrigger value="url">URL</TabsTrigger>
                    <TabsTrigger value="embed">Embed</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {slot.mode === 'url' ? (
                <div className="space-y-1">
                  <Label className="text-xs">Order form URL</Label>
                  <Input
                    placeholder="https://link.rprx4life.com/widget/form/…"
                    value={slot.value}
                    onChange={(e) => setSlot(plan, interval, { ...slot, value: e.target.value })}
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <Label className="text-xs">Embed snippet (iframe + script)</Label>
                  <Textarea
                    rows={6}
                    className="font-mono text-xs"
                    placeholder='<iframe src="https://link.rprx4life.com/widget/form/…" ...></iframe><script src="https://link.msgsndr.com/js/form_embed.js"></script>'
                    value={slot.value}
                    onChange={(e) => setSlot(plan, interval, { ...slot, value: e.target.value })}
                  />
                </div>
              )}
              {!slot.value.trim() && (
                <p className="text-xs text-muted-foreground">
                  Leave blank to show "not configured" in the upgrade modal.
                </p>
              )}
            </Card>
          );
        })}

        <Card className="p-4 space-y-3 lg:col-span-2">
          <h3 className="font-semibold">Public Funnel (logged-out CTA)</h3>
          <div className="space-y-1">
            <Label className="text-xs">Funnel URL</Label>
            <Input
              placeholder="https://link.rprx4life.com/pricing"
              value={draft.publicFunnel}
              onChange={(e) => setDraft((d) => (d ? { ...d, publicFunnel: e.target.value } : d))}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
