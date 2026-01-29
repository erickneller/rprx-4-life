import { MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Conversation } from '@/hooks/useConversations';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function ConversationItem({ conversation, isActive, onClick, onDelete }: ConversationItemProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors',
        isActive 
          ? 'bg-primary/10 text-primary' 
          : 'hover:bg-muted'
      )}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{conversation.title}</p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-40 hover:opacity-100 transition-opacity"
        onClick={handleDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
