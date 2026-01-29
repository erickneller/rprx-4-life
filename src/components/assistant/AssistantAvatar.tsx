import assistantAvatar from '@/assets/rprx-chatguy.png';
import { cn } from '@/lib/utils';

interface AssistantAvatarProps {
  size?: 'sm' | 'lg';
  className?: string;
}

export function AssistantAvatar({ size = 'sm', className }: AssistantAvatarProps) {
  const sizeClasses = size === 'lg' ? 'h-16 w-16' : 'h-8 w-8';
  
  return (
    <img 
      src={assistantAvatar} 
      alt="RPRx Strategy Assistant"
      className={cn(sizeClasses, 'rounded-full object-cover shrink-0', className)}
    />
  );
}
