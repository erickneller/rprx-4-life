import { useState } from 'react';
import { useAdminCompanyRollup, type CompanyRollup } from '@/hooks/useAdminInsights';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { CompanyDetailDrawer } from './CompanyDetailDrawer';

export function CompaniesTab() {
  const { data: companies = [], isLoading } = useAdminCompanyRollup();
  const [selected, setSelected] = useState<CompanyRollup | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Members</TableHead>
                <TableHead className="text-right">Free</TableHead>
                <TableHead className="text-right">Partner</TableHead>
                <TableHead className="text-right">Pro</TableHead>
                <TableHead className="text-right">Active 7d</TableHead>
                <TableHead className="text-right">Active 30d</TableHead>
                <TableHead className="text-right">Assessments</TableHead>
                <TableHead className="text-right">Video opens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map(c => (
                <TableRow
                  key={c.company_id}
                  className="cursor-pointer"
                  onClick={() => setSelected(c)}
                >
                  <TableCell className="font-medium">{c.company_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">{c.plan}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{c.member_count}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{c.free_count}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{c.partner_count}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{c.pro_count}</TableCell>
                  <TableCell className="text-right">{c.active_last_7d}</TableCell>
                  <TableCell className="text-right">{c.active_last_30d}</TableCell>
                  <TableCell className="text-right">{c.assessments_completed}</TableCell>
                  <TableCell className="text-right">{c.total_video_opens}</TableCell>
                </TableRow>
              ))}
              {companies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    No companies yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CompanyDetailDrawer
        company={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}
