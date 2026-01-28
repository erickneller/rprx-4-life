import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewConversationButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function NewConversationButton({ onClick, disabled }: NewConversationButtonProps) {
  return (
    <Button 
      onClick={onClick} 
      disabled={disabled}
      className="w-full justify-start gap-2"
      variant="outline"
    >
      <Plus className="h-4 w-4" />
      New Conversation
    </Button>
  );
}
