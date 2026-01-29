import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, FileType } from 'lucide-react';
import { exportPlanAsPDF, downloadMarkdown } from '@/lib/planExport';
import type { SavedPlan } from '@/hooks/usePlans';

interface PlanDownloadProps {
  plan: SavedPlan;
}

export function PlanDownload({ plan }: PlanDownloadProps) {
  const handleDownloadPDF = () => {
    exportPlanAsPDF(plan);
  };

  const handleDownloadMarkdown = () => {
    downloadMarkdown(plan);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDownloadPDF}>
          <FileType className="h-4 w-4 mr-2" />
          Download as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadMarkdown}>
          <FileText className="h-4 w-4 mr-2" />
          Download as Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
