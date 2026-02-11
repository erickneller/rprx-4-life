import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCreateConversation, useUpdateConversationTitle } from '@/hooks/useConversations';
import { useSendMessage } from '@/hooks/useSendMessage';
import { ConversationSidebar } from '@/components/assistant/ConversationSidebar';
import { ChatThread } from '@/components/assistant/ChatThread';
import { DisclaimerFooter } from '@/components/assistant/DisclaimerFooter';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function StrategyAssistant() {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [autoHorseman, setAutoHorseman] = useState<string | null>(null);

  // Open conversation from URL query param (e.g., ?c=uuid)
  useEffect(() => {
    const cId = searchParams.get('c');
    if (cId) {
      setActiveConversationId(cId);
      if (searchParams.get('auto') === '1') {
        setAutoMode(true);
        setAutoHorseman(searchParams.get('horseman'));
      }
      // Clean up the URL
      searchParams.delete('c');
      searchParams.delete('auto');
      searchParams.delete('horseman');
      setSearchParams(searchParams, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  const createConversation = useCreateConversation();
  const updateTitle = useUpdateConversationTitle();
  const { sendMessage, isLoading: isSending, error: sendError } = useSendMessage();

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setSidebarOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setSidebarOpen(false);
  };

  const handleSendMessage = async (message: string) => {
    const result = await sendMessage({
      conversationId: activeConversationId,
      userMessage: message,
    });

    if (result) {
      if (!activeConversationId) {
        setActiveConversationId(result.conversationId);
        
        const title = message.length > 50 
          ? message.substring(0, 47) + '...' 
          : message;
        updateTitle.mutate({ id: result.conversationId, title });
      }
    }
  };

  const conversationSidebarContent = (
    <ConversationSidebar
      activeConversationId={activeConversationId}
      onSelectConversation={handleSelectConversation}
      onNewConversation={handleNewConversation}
      isCreating={createConversation.isPending}
    />
  );

  return (
    <AuthenticatedLayout title="Strategy Assistant">
      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        <div className="flex flex-1 overflow-hidden">
          {/* Mobile conversation sidebar toggle */}
          {isMobile && (
            <div className="border-b px-2 py-2">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-4 w-4 mr-2" />
                    Conversations
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  {conversationSidebarContent}
                </SheetContent>
              </Sheet>
            </div>
          )}

          {/* Desktop conversation sidebar */}
          {!isMobile && (
            <div className="w-72 shrink-0 border-r">
              {conversationSidebarContent}
            </div>
          )}

          {/* Chat area */}
          <div className="flex flex-1 flex-col">
            <ChatThread
              conversationId={activeConversationId}
              onSendMessage={handleSendMessage}
              isSending={isSending}
              autoMode={autoMode}
              autoHorseman={autoHorseman}
            />
            
            {sendError && (
              <div className="px-4 py-2 text-sm text-destructive bg-destructive/10 text-center">
                {sendError}
              </div>
            )}
          </div>
        </div>

        <DisclaimerFooter />
      </div>
    </AuthenticatedLayout>
  );
}
