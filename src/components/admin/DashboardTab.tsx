import { useState, useCallback } from 'react';
import { useDashboardConfig, useUpdateCardConfig, useReorderCards, type DashboardCardConfig } from '@/hooks/useDashboardConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowUp, ArrowDown, GripVertical, Plus, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

export function DashboardTab() {
  const { cards, isLoading } = useDashboardConfig();
  const updateCard = useUpdateCardConfig();
  const reorderCards = useReorderCards();

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
    const orderedIds = newOrder.map(c => c.id);

    try {
      await reorderCards.mutateAsync(orderedIds);
      toast.success('Dashboard layout updated');
    } catch {
      toast.error('Failed to reorder cards');
    }
  }, [cards, reorderCards]);

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
        {cards.map((card, index) => (
          <Card key={card.id} className="border">
            <CardContent className="p-4 flex items-center gap-4">
              {/* Drag handle placeholder */}
              <GripVertical className="h-5 w-5 text-muted-foreground shrink-0 opacity-30" />

              {/* Reorder arrows */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index === 0 || reorderCards.isPending}
                  onClick={() => handleMove(index, 'up')}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index === cards.length - 1 || reorderCards.isPending}
                  onClick={() => handleMove(index, 'down')}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>

              {/* Card info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{card.display_name}</p>
                {card.description && (
                  <p className="text-xs text-muted-foreground truncate">{card.description}</p>
                )}
              </div>

              {/* Size selector */}
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

              {/* Visibility toggle */}
              <Switch
                checked={card.is_visible}
                onCheckedChange={(checked) => handleToggleVisibility(card.id, checked)}
                disabled={updateCard.isPending}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Future: Add Custom Card */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" className="w-full gap-2 opacity-50 cursor-not-allowed" disabled>
            <Plus className="h-4 w-4" />
            Add Custom Card
          </Button>
        </TooltipTrigger>
        <TooltipContent>Coming soon — add custom content cards to the dashboard</TooltipContent>
      </Tooltip>
    </div>
  );
}
