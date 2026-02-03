import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCreateConversation, useUpdateConversationTitle } from '@/hooks/useConversations';
import { useSendMessage } from '@/hooks/useSendMessage';
import { ConversationSidebar } from '@/components/assistant/ConversationSidebar';
import { ChatThread } from '@/components/assistant/ChatThread';
import { DisclaimerFooter } from '@/components/assistant/DisclaimerFooter';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function StrategyAssistant() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const createConversation = useCreateConversation();
  const updateTitle = useUpdateConversationTitle();
  const { sendMessage, isLoading: isSending, error: sendError } = useSendMessage();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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
      // If this was a new conversation, set it as active
      if (!activeConversationId) {
        setActiveConversationId(result.conversationId);
        
        // Generate title from first message (first 50 chars)
        const title = message.length > 50 
          ? message.substring(0, 47) + '...' 
          : message;
        updateTitle.mutate({ id: result.conversationId, title });
      }
    }
  };


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const sidebarContent = (
    <ConversationSidebar
      activeConversationId={activeConversationId}
      onSelectConversation={handleSelectConversation}
      onNewConversation={handleNewConversation}
      isCreating={createConversation.isPending}
    />
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                {sidebarContent}
              </SheetContent>
            </Sheet>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard')}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">RPRx Strategy Assistant</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <ProfileAvatar />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        {!isMobile && (
          <div className="w-72 shrink-0">
            {sidebarContent}
          </div>
        )}

        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          <ChatThread
            conversationId={activeConversationId}
            onSendMessage={handleSendMessage}
            isSending={isSending}
          />
          
          {sendError && (
            <div className="px-4 py-2 text-sm text-destructive bg-destructive/10 text-center">
              {sendError}
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer footer */}
      <DisclaimerFooter />
    </div>
  );
}
