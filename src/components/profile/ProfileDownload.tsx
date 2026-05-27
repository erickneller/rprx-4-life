import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileType, FileSpreadsheet, Printer } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useProfileFieldSettings } from '@/hooks/useProfileFieldSettings';
import {
  buildProfileExportRows,
  exportProfileAsPDF,
  exportProfileAsCSV,
} from '@/lib/profileExport';

export function ProfileDownload() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { isVisible } = useProfileFieldSettings();

  const buildUser = () => ({
    email: user?.email ?? null,
    fullName: profile?.full_name ?? null,
  });

  const buildRows = () => buildProfileExportRows(profile as any, isVisible, buildUser());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={!profile}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportProfileAsPDF(buildRows(), buildUser())}>
          <FileType className="h-4 w-4 mr-2" />
          Download as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportProfileAsCSV(buildRows(), buildUser())}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Download as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
