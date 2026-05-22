import { useState, useCallback } from 'react';
import {
  useDashboardConfig,
  useUpdateCardConfig,
  useReorderCards,
  useCreateCustomCard,
  useDeleteCustomCard,
  type DashboardCardConfig,
  type CustomCardInput,
} from '@/hooks/useDashboardConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowUp, ArrowDown, GripVertical, Plus, Info, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CustomCardDialog } from './CustomCardDialog';

export function DashboardTab() {
  const { cards, isLoading } = useDashboardConfig();
  const updateCard = useUpdateCardConfig();
  const reorderCards = useReorderCards();
  const createCustom = useCreateCustomCard();
  const deleteCustom = useDeleteCustomCard();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<DashboardCardConfig | null>(null);

  const handleToggleVisibility = useCallback(async (id: string, visible: boolean) => {
    try {
      await updateCard.mutateAsync({ id, updates: { is_visible: visible } });
      toast.success('Dashboard layout updated');
    } catch {
      toast.error('Failed to update card');
    }
  }, [updateCard]);

  const handleSizeChange = useCallback(async (id: string, size: string) => {
    try {
      await updateCard.mutateAsync({ id, updates: { default_size: size as DashboardCardConfig['default_size'] } });
      toast.success('Dashboard layout updated');
    } catch {
      toast.error('Failed to update card size');
    }
  }, [updateCard]);

  const handleMove = useCallback(async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= cards.length) return;
    const newOrder = [...cards];
    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
    try {
      await reorderCards.mutateAsync(newOrder.map(c => c.id));
      toast.success('Dashboard layout updated');
    } catch {
      toast.error('Failed to reorder cards');
    }
  }, [cards, reorderCards]);

  const handleSaveCustom = useCallback(async (input: CustomCardInput) => {
    try {
      if (editingCard) {
        await updateCard.mutateAsync({
          id: editingCard.id,
          updates: {
            display_name: input.title,
            title: input.title,
            content_type: input.content_type,
            content: input.content,
            default_size: input.default_size,
            audience_company_ids: input.audience_company_ids,
            audience_tiers: input.audience_tiers,
          },
        });
        toast.success('Custom card updated');
      } else {
        await createCustom.mutateAsync(input);
        toast.success('Custom card created');
      }
      setDialogOpen(false);
      setEditingCard(null);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save custom card');
    }
  }, [editingCard, updateCard, createCustom]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this custom card? This cannot be undone.')) return;
    try {
      await deleteCustom.mutateAsync(id);
      toast.success('Custom card deleted');
    } catch {
      toast.error('Failed to delete card');
    }
  }, [deleteCustom]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Dashboard Card Configuration</h2>
        <p className="text-sm text-muted-foreground">Control which cards appear on the user dashboard and their display order.</p>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
        <Info className="h-4 w-4 shrink-0" />
        <span>Changes apply immediately to all users' dashboards.</span>
      </div>

      <div className="space-y-2">
        {cards.map((card, index) => {
          const audienceParts: string[] = [];
          if ((card.audience_tiers ?? []).length > 0) audienceParts.push(card.audience_tiers.join(', '));
          if ((card.audience_company_ids ?? []).length > 0) audienceParts.push(`${card.audience_company_ids.length} co.`);
          const audienceLabel = audienceParts.length > 0 ? audienceParts.join(' · ') : 'All users';
          return (
            <Card key={card.id} className="border">
              <CardContent className="p-4 flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-muted-foreground shrink-0 opacity-30" />

                <div className="flex flex-col gap-0.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-6 w-6"
                    disabled={index === 0 || reorderCards.isPending}
                    onClick={() => handleMove(index, 'up')}>
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6"
                    disabled={index === cards.length - 1 || reorderCards.isPending}
                    onClick={() => handleMove(index, 'down')}>
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{card.display_name}</p>
                    {card.is_custom && <Badge variant="secondary" className="text-[10px]">Custom</Badge>}
                  </div>
                  {card.description && (
                    <p className="text-xs text-muted-foreground truncate">{card.description}</p>
                  )}
                  {card.is_custom && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {card.content_type} · {audienceLabel}
                    </p>
                  )}
                </div>

                {card.is_custom && (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => { setEditingCard(card); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(card.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}

                <Select value={card.default_size} onValueChange={(v) => handleSizeChange(card.id, v)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Width</SelectItem>
                    <SelectItem value="half">Half Width</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>

                <Switch
                  checked={card.is_visible}
                  onCheckedChange={(checked) => handleToggleVisibility(card.id, checked)}
                  disabled={updateCard.isPending}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => { setEditingCard(null); setDialogOpen(true); }}
      >
        <Plus className="h-4 w-4" />
        Add Custom Card
      </Button>

      <CustomCardDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingCard(null); }}
        initial={editingCard}
        onSave={handleSaveCustom}
        isSaving={createCustom.isPending || updateCard.isPending}
      />
    </div>
  );
}
