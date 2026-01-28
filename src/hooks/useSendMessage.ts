import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Message } from './useMessages';

interface SendMessageParams {
  conversationId: string | null;
  userMessage: string;
}

interface SendMessageResult {
  conversationId: string;
  assistantMessage: string;
}

export function useSendMessage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const sendMessage = async ({ conversationId, userMessage }: SendMessageParams): Promise<SendMessageResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Optimistically add user message to cache
      if (conversationId) {
        const userMsg: Message = {
          id: crypto.randomUUID(),
          conversation_id: conversationId,
          role: 'user',
          content: userMessage,
          created_at: new Date().toISOString(),
        };
        
        queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => 
          old ? [...old, userMsg] : [userMsg]
        );
      }

      const { data, error: invokeError } = await supabase.functions.invoke('rprx-chat', {
        body: {
          conversation_id: conversationId,
          user_message: userMessage,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversation_id] });

      return {
        conversationId: data.conversation_id,
        assistantMessage: data.assistant_message,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
      
      // Revert optimistic update on error
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isLoading, error };
}
