import { useEffect, useRef } from 'react';
import { useMessages, Message } from '@/hooks/useMessages';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { AssistantAvatar } from './AssistantAvatar';

interface ChatThreadProps {
  conversationId: string | null;
  onSendMessage: (message: string) => void;
  isSending: boolean;
}

export function ChatThread({ conversationId, onSendMessage, isSending }: ChatThreadProps) {
  const { data: messages, isLoading } = useMessages(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending]);

  if (!conversationId) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="mx-auto mb-4">
              <AssistantAvatar size="lg" />
            </div>
            <h2 className="text-xl font-semibold mb-2">RPRx Strategy Assistant</h2>
            <p className="text-muted-foreground">
              Start a new conversation to discover strategies that can help reduce the impact of 
              the Four Horsemen on your finances: Interest, Taxes, Insurance, and Education.
            </p>
            <Button 
              variant="outline"
              className="mt-4"
              onClick={() => onSendMessage('Help me choose the best strategies to achieve financial wellness!')}
              disabled={isSending}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Help me choose the best strategies to achieve financial wellness!
            </Button>
          </div>
        </div>
        <ChatInput onSend={onSendMessage} disabled={isSending} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {isLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <Skeleton className="h-16 w-[60%] rounded-2xl" />
                </div>
              ))}
            </>
          ) : messages && messages.length > 0 ? (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AssistantAvatar className="mx-auto mb-2 opacity-50" />
              <p>Send a message to start the conversation.</p>
            </div>
          )}
          
          {isSending && (
            <div className="flex gap-3">
              <AssistantAvatar />
              <div className="bg-muted rounded-2xl px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      
      <ChatInput 
        onSend={onSendMessage} 
        disabled={isSending}
        placeholder={isSending ? 'Waiting for response...' : 'Type your message...'}
      />
    </div>
  );
}
