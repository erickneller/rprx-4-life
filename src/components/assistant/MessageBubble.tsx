import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Message } from '@/hooks/useMessages';
import { User } from 'lucide-react';
import { AssistantAvatar } from './AssistantAvatar';
import { SavePlanButton } from '@/components/plans/SavePlanButton';
import { parseStrategyFromMessage, parseMultiPlanFromMessage } from '@/lib/strategyParser';
import { StrategyPlanCard } from './StrategyPlanCard';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const multiPlan = useMemo(() => {
    if (isUser) return null;
    return parseMultiPlanFromMessage(message.content);
  }, [isUser, message.content]);

  const parsedStrategy = useMemo(() => {
    if (isUser || multiPlan) return null;
    return parseStrategyFromMessage(message.content);
  }, [isUser, multiPlan, message.content]);

  // Strip the raw JSON code block from the prose body when we have a structured plan to render.
  const displayContent = useMemo(() => {
    if (multiPlan) return '';
    if (!parsedStrategy) return message.content;
    return message.content.replace(/```json\s*\n[\s\S]*?\n```/, '').replace(/\n{3,}/g, '\n\n').trim();
  }, [multiPlan, parsedStrategy, message.content]);

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <User className="h-4 w-4" />
        </div>
      ) : (
        <AssistantAvatar />
      )}
      
      <div
        className={cn(
          'rounded-2xl px-4 py-3 min-w-0',
          isUser ? 'bg-primary text-primary-foreground max-w-[80%]' : 'bg-muted',
          !isUser && parsedStrategy ? 'max-w-[92%] flex-1' : !isUser ? 'max-w-[80%]' : ''
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="space-y-3">
            {parsedStrategy && (
              <StrategyPlanCard
                strategyId={parsedStrategy.strategyId}
                strategyName={parsedStrategy.strategyName}
                content={parsedStrategy.content}
                renderBlocks={parsedStrategy.renderBlocks}
              />
            )}

            {displayContent && (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-1">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-bold mt-4 mb-2">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="my-2 leading-relaxed">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4 rounded-md border border-border">
                        <table className="min-w-full border-collapse text-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-muted/50">{children}</thead>
                    ),
                    th: ({ children }) => (
                      <th className="border-b border-border px-3 py-2 text-left font-medium">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border-b border-border px-3 py-2">
                        {children}
                      </td>
                    ),
                    a: ({ href, children }) => (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {children}
                      </a>
                    ),
                    hr: () => (
                      <hr className="my-4 border-border" />
                    ),
                  }}
                >
                  {displayContent}
                </ReactMarkdown>
              </div>
            )}
            
            {parsedStrategy && (
              <div className="pt-2 border-t border-border/50">
                <SavePlanButton
                  strategyId={parsedStrategy.strategyId}
                  strategyName={parsedStrategy.strategyName}
                  content={parsedStrategy.content}
                  variant="outline"
                  size="sm"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
