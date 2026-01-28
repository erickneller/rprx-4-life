import { useConversations, useDeleteConversation } from '@/hooks/useConversations';
import { ConversationItem } from './ConversationItem';
import { NewConversationButton } from './NewConversationButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { Conversation } from '@/hooks/useConversations';

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

  const groupedConversations = conversations ? groupConversations(conversations) : [];

  return (
    <div className="flex h-full flex-col border-r bg-muted/20">
      <div className="p-4">
        <NewConversationButton onClick={onNewConversation} disabled={isCreating} />
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
                      onDelete={() => deleteConversation.mutate(conv.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
