import { useSidebarConfig, useUpdateNavVisibility } from '@/hooks/useSidebarConfig';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const NON_HIDEABLE = ['item:dashboard'];

export function NavigationTab() {
  const { rows, isLoading } = useSidebarConfig();
  const updateVisibility = useUpdateNavVisibility();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sections: { section: typeof rows[0] | null; items: typeof rows }[] = [];
  let currentSection: typeof rows[0] | null = null;
  let currentItems: typeof rows = [];

  for (const row of rows) {
    if (row.id.startsWith('section:')) {
      if (currentSection || currentItems.length > 0) {
        sections.push({ section: currentSection, items: currentItems });
      }
      currentSection = row;
      currentItems = [];
    } else {
      currentItems.push(row);
    }
  }
  if (currentSection || currentItems.length > 0) {
    sections.push({ section: currentSection, items: currentItems });
  }

  const handleToggle = async (id: string, visible: boolean) => {
    try {
      await updateVisibility.mutateAsync({ id, visible });
      toast.success(visible ? 'Shown' : 'Hidden');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleSectionToggle = async (section: typeof rows[0], items: typeof rows, visible: boolean) => {
    try {
      await updateVisibility.mutateAsync({ id: section.id, visible });
      for (const item of items) {
        if (!NON_HIDEABLE.includes(item.id)) {
          await updateVisibility.mutateAsync({ id: item.id, visible });
        }
      }
      toast.success(visible ? 'Section shown' : 'Section hidden');
    } catch {
      toast.error('Failed to update section');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sidebar Navigation Visibility</CardTitle>
          <CardDescription>
            Show or hide sidebar sections and items for all users. Dashboard is always visible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {sections.map((group, idx) => (
            <div key={idx} className="space-y-3">
              {group.section && (
                <div className="flex items-center justify-between border-b pb-2">
                  <Label className="text-sm font-bold">{group.section.label}</Label>
                  <Switch
                    checked={group.section.visible}
                    onCheckedChange={(checked) => handleSectionToggle(group.section!, group.items, checked)}
                    disabled={updateVisibility.isPending}
                  />
                </div>
              )}
              {group.items.map((item) => {
                const isLocked = NON_HIDEABLE.includes(item.id);
                return (
                  <div key={item.id} className="flex items-center justify-between pl-4">
                    <Label className="text-sm text-muted-foreground">{item.label}</Label>
                    <Switch
                      checked={item.visible}
                      onCheckedChange={(checked) => handleToggle(item.id, checked)}
                      disabled={isLocked || updateVisibility.isPending}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
