import { useState } from 'react';
import { useConversations, useDeleteConversation, useClearAllConversations } from '@/hooks/useConversations';
import { ConversationItem } from './ConversationItem';
import { NewConversationButton } from './NewConversationButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { isToday, isYesterday, isThisWeek } from 'date-fns';
import { Conversation } from '@/hooks/useConversations';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConversationSidebarProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  isCreating: boolean;
}

function groupConversations(conversations: Conversation[]) {
  const groups: { [key: string]: Conversation[] } = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Older: [],
  };

  conversations.forEach((conv) => {
    const date = new Date(conv.updated_at);
    if (isToday(date)) {
      groups['Today'].push(conv);
    } else if (isYesterday(date)) {
      groups['Yesterday'].push(conv);
    } else if (isThisWeek(date)) {
      groups['This Week'].push(conv);
    } else {
      groups['Older'].push(conv);
    }
  });

  return Object.entries(groups).filter(([, convs]) => convs.length > 0);
}

export function ConversationSidebar({
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  isCreating,
}: ConversationSidebarProps) {
  const { data: conversations, isLoading } = useConversations();
  const deleteConversation = useDeleteConversation();
  const clearAllConversations = useClearAllConversations();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  const groupedConversations = conversations ? groupConversations(conversations) : [];

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteConversation.mutate(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const handleClearAll = () => {
    clearAllConversations.mutate();
    setShowClearAllDialog(false);
  };

  return (
    <div className="flex h-full flex-col border-r bg-muted/20">
      <div className="p-4 space-y-2">
        <NewConversationButton onClick={onNewConversation} disabled={isCreating} />
        
        {conversations && conversations.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Manage conversations
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setShowClearAllDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear all conversations
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <ScrollArea className="flex-1 px-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : groupedConversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No conversations yet. Start a new one!
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {groupedConversations.map(([group, convs]) => (
              <div key={group}>
                <h3 className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {group}
                </h3>
                <div className="space-y-1">
                  {convs.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={conv.id === activeConversationId}
                      onClick={() => onSelectConversation(conv.id)}
                      onDelete={() => setDeleteTarget(conv.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Single delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear all confirmation */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all conversations?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your conversations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
