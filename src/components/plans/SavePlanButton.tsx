import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { SavePlanModal } from './SavePlanModal';
import type { PlanContent } from '@/hooks/usePlans';

interface SavePlanButtonProps {
  strategyId?: string;
  strategyName: string;
  content: PlanContent;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
}

export function SavePlanButton({ 
  strategyId, 
  strategyName, 
  content,
  variant = 'ghost',
  size = 'sm'
}: SavePlanButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={(e) => {
          e.stopPropagation();
          setModalOpen(true);
        }}
        className="gap-1"
      >
        <Bookmark className="h-4 w-4" />
        {size !== 'icon' && 'Save Plan'}
      </Button>
      
      <SavePlanModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialData={{
          strategyId,
          strategyName,
          content,
        }}
      />
    </>
  );
}
