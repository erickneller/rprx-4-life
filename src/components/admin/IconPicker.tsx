import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAllIconNames, getIcon, POPULAR_ICONS } from '@/lib/lucideIconMap';

interface IconPickerProps {
  value?: string | null;
  onChange: (name: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const Current = getIcon(value);

  const all = useMemo(() => getAllIconNames(), []);
  const filtered = useMemo(() => {
    if (!q) return [...POPULAR_ICONS, ...all.filter(n => !POPULAR_ICONS.includes(n))].slice(0, 240);
    const ql = q.toLowerCase();
    return all.filter(n => n.toLowerCase().includes(ql)).slice(0, 240);
  }, [q, all]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" type="button" className="gap-2">
          <Current className="h-4 w-4" />
          <span className="text-xs">{value || 'Pick icon'}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose an icon</DialogTitle>
        </DialogHeader>
        <Input placeholder="Search icons..." value={q} onChange={(e) => setQ(e.target.value)} />
        <ScrollArea className="h-[400px]">
          <div className="grid grid-cols-8 gap-2 p-1">
            {filtered.map((name) => {
              const I = getIcon(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => { onChange(name); setOpen(false); }}
                  className={`flex flex-col items-center gap-1 rounded-md border p-2 hover:bg-accent transition-colors ${value === name ? 'border-primary bg-accent' : 'border-border'}`}
                  title={name}
                >
                  <I className="h-5 w-5" />
                  <span className="text-[9px] truncate w-full text-center text-muted-foreground">{name}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
