import { useEffect, useRef } from 'react';
import { useMessages, Message } from '@/hooks/useMessages';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, User, Search, LucideIcon } from 'lucide-react';
import { AssistantAvatar } from './AssistantAvatar';

interface StarterOption {
  icon: LucideIcon;
  title: string;
  description: string;
  message: string;
}

const starterOptions: StarterOption[] = [
  {
    icon: User,
    title: "Use My Profile",
    description: "Get personalized strategies based on your profile data and financial goals.",
    message: "Based on my current profile and financial goals, what strategies would you recommend?"
  },
  {
    icon: Search,
    title: "Specific Need",
    description: "Ask about a particular financial topic that may not be in your profile.",
    message: "I have a specific financial question or situation I'd like to discuss."
  }
];

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
          <div className="text-center max-w-lg px-4">
            <div className="flex justify-center mb-4">
              <AssistantAvatar size="lg" className="animate-float" />
            </div>
            <h2 className="text-xl font-semibold mb-2">RPRx Strategy Assistant</h2>
            <p className="text-muted-foreground mb-6">
              How would you like to get started?
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {starterOptions.map((option) => (
                <Card 
                  key={option.title}
                  className="cursor-pointer transition-all hover:border-primary hover:shadow-md text-left"
                  onClick={() => !isSending && onSendMessage(option.message)}
                >
                  <CardContent className="p-4">
                    <option.icon className="h-6 w-6 text-primary mb-2" />
                    <h3 className="font-medium mb-1">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <p className="text-sm text-muted-foreground">
              Or type your question below
            </p>
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
