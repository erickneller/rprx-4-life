import { useMemo, useState, useEffect } from 'react';
import { useLandingCards, useUpdateLandingCard, useReorderLandingCards } from '@/hooks/useLandingCards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { LandingCardRow } from '@/lib/landingCards';

function CardEditor({ card }: { card: LandingCardRow }) {
  const update = useUpdateLandingCard();
  const [open, setOpen] = useState(false);
  const [jsonDraft, setJsonDraft] = useState(() => JSON.stringify(card.content, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setJsonDraft(JSON.stringify(card.content, null, 2));
  }, [card.content]);

  const handleSave = async () => {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonDraft);
    } catch (e: any) {
      setJsonError(e.message);
      return;
    }
    setJsonError(null);
    try {
      await update.mutateAsync({ id: card.id, updates: { content: parsed } });
      toast.success(`${card.display_name} updated`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    }
  };

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50"
      >
        <span>{open ? 'Hide content' : 'Edit content'}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="p-4 space-y-3">
          <Label className="text-xs">
            Content (JSON). Edit text, button labels, and button <code>url</code> fields.
            Buttons accept any URL — internal (<code>/auth</code>, <code>#pricing</code>) or external (full URL).
          </Label>
          <Textarea
            value={jsonDraft}
            onChange={(e) => setJsonDraft(e.target.value)}
            className="font-mono text-xs min-h-[300px]"
            spellCheck={false}
          />
          {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={update.isPending}>
              {update.isPending && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
              Save changes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setJsonDraft(JSON.stringify(card.content, null, 2));
                setJsonError(null);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SortableRow({ card }: { card: LandingCardRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const update = useUpdateLandingCard();
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <Card ref={setNodeRef} style={style}>
      <CardHeader className="py-3">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            aria-label="Drag to reorder"
            style={{ touchAction: 'none' }}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <CardTitle className="text-base flex-1">{card.display_name}</CardTitle>
          <span className="text-xs text-muted-foreground">{card.component_key}</span>
          <Switch
            checked={card.is_visible}
            onCheckedChange={(v) =>
              update.mutateAsync({ id: card.id, updates: { is_visible: v } })
                .then(() => toast.success(v ? 'Shown' : 'Hidden'))
                .catch((e) => toast.error(e.message))
            }
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <CardEditor card={card} />
      </CardContent>
    </Card>
  );
}

export function LandingPageTab() {
  const { data: cards = [], isLoading } = useLandingCards();
  const reorder = useReorderLandingCards();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const ids = useMemo(() => cards.map((c) => c.id), [cards]);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    const next = [...ids];
    const [m] = next.splice(oldIdx, 1);
    next.splice(newIdx, 0, m);
    reorder.mutateAsync(next).catch((err) => toast.error(err.message));
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Landing Page Sections</h2>
        <p className="text-sm text-muted-foreground">
          Drag to reorder, toggle visibility, and edit content (including CTA button URLs).
        </p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {cards.map((card) => <SortableRow key={card.id} card={card} />)}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
