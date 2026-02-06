import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ExitAssessmentDialogProps {
  open: boolean;
  onContinue: () => void;
  onExit: () => void;
}

export function ExitAssessmentDialog({
  open,
  onContinue,
  onExit,
}: ExitAssessmentDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onContinue()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Exit Assessment?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span className="block">
              Your progress will not be saved. Only completed assessments are saved to your profile.
            </span>
            <span className="block">
              The assessment only takes 2-3 minutes to complete. We encourage you to finish it now!
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onExit}>
            Exit Anyway
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onContinue}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Continue Assessment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
