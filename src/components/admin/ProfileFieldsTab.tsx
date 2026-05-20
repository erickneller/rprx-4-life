import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfileFieldSettings, type ProfileFieldSetting } from '@/hooks/useProfileFieldSettings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SECTION_LABELS: Record<string, string> = {
  basic: 'Basic Identity',
  cashflow: 'Cash Flow',
  tax: 'Taxes',
  household: 'Household',
  insurance: 'Insurance',
  goals: 'Financial Goals',
  retirement: 'Retirement',
  stress: 'Financial Stress',
  motivation: 'Motivation',
};

const IDENTITY_KEYS = new Set(['full_name', 'phone']);

export function ProfileFieldsTab() {
  const { settings, isLoading } = useProfileFieldSettings();
  const qc = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const g: Record<string, ProfileFieldSetting[]> = {};
    settings.forEach((s) => {
      (g[s.section] ||= []).push(s);
    });
    return g;
  }, [settings]);

  const save = async (key: string, patch: Partial<ProfileFieldSetting>) => {
    setPending(key);
    try {
      const { error } = await (supabase as any)
        .from('profile_field_settings')
        .update(patch)
        .eq('field_key', key);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ['profile_field_settings'] });
      toast.success('Saved');
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    } finally {
      setPending(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Profile Fields</h2>
        <p className="text-sm text-muted-foreground">
          Choose which fields are shown in the user's profile and wizard, and which are required.
          Hidden fields are never required.
        </p>
      </div>

      {Object.entries(grouped).map(([section, rows]) => (
        <div key={section} className="border rounded-lg overflow-hidden">
          <div className="bg-muted/40 px-4 py-2 font-medium text-sm">
            {SECTION_LABELS[section] || section}
          </div>
          <div className="divide-y">
            {rows.map((row) => {
              const isIdentity = IDENTITY_KEYS.has(row.field_key);
              return (
                <div key={row.field_key} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{row.label}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      <code>{row.field_key}</code>
                      {isIdentity && (
                        <span className="ml-2 text-amber-600 dark:text-amber-400">
                          (used during signup — hiding may break account creation)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`show-${row.field_key}`} className="text-xs text-muted-foreground">Show</Label>
                      <Switch
                        id={`show-${row.field_key}`}
                        checked={row.visible}
                        disabled={pending === row.field_key}
                        onCheckedChange={(v) => save(row.field_key, { visible: v, required: v ? row.required : false })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`req-${row.field_key}`} className="text-xs text-muted-foreground">Required</Label>
                      <Switch
                        id={`req-${row.field_key}`}
                        checked={row.required && row.visible}
                        disabled={!row.visible || pending === row.field_key}
                        onCheckedChange={(v) => save(row.field_key, { required: v })}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
