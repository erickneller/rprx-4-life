import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { parseCSV, coerceRow, importTableViaEdge } from '@/lib/csvImport';

interface DataImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  tableLabel: string;
  onImported?: () => void;
}

export function DataImportDialog({
  open,
  onOpenChange,
  tableName,
  tableLabel,
  onImported,
}: DataImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mode, setMode] = useState<'upsert' | 'replace'>('upsert');
  const [confirmText, setConfirmText] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setMode('upsert');
    setConfirmText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    try {
      const text = await f.text();
      const parsed = parseCSV(text);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
    } catch (err) {
      toast.error(`Failed to parse CSV: ${(err as Error).message}`);
    }
  };

  const handleImport = async () => {
    if (rows.length === 0) {
      toast.error('No rows to import');
      return;
    }
    if (mode === 'upsert' && !headers.includes('id')) {
      toast.error('CSV must include an "id" column for upsert mode');
      return;
    }
    if (mode === 'replace' && confirmText !== tableName) {
      toast.error(`Type "${tableName}" to confirm replace`);
      return;
    }

    setImporting(true);
    try {
      const coerced = rows.map(coerceRow);
      const result = await importTableViaEdge(tableName, coerced, mode);
      toast.success(`Imported ${result.rowsProcessed} rows into ${tableLabel}`);
      onImported?.();
      handleClose(false);
    } catch (err) {
      toast.error(`Import failed: ${(err as Error).message}`);
    } finally {
      setImporting(false);
    }
  };

  const sampleRow = rows[0];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import CSV → {tableLabel}</DialogTitle>
          <DialogDescription>
            Upload a CSV exported from this table. Keep the same headers — unknown columns are ignored.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV file</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={importing}
            />
          </div>

          {file && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>{file.name}</strong> — {rows.length} rows, {headers.length} columns
              </AlertDescription>
            </Alert>
          )}

          {sampleRow && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Sample row preview</Label>
              <div className="rounded-md border bg-muted/30 p-3 max-h-40 overflow-auto">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {JSON.stringify(sampleRow, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {rows.length > 0 && (
            <div className="space-y-2">
              <Label>Import mode</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'upsert' | 'replace')}>
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="upsert" id="mode-upsert" className="mt-1" />
                  <Label htmlFor="mode-upsert" className="font-normal cursor-pointer">
                    <span className="font-medium">Upsert</span> — insert new rows, update existing rows by <code className="text-xs">id</code>
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="replace" id="mode-replace" className="mt-1" />
                  <Label htmlFor="mode-replace" className="font-normal cursor-pointer">
                    <span className="font-medium text-destructive">Replace all</span> — wipe the table first, then insert
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {mode === 'replace' && rows.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <p>This will <strong>delete all existing rows</strong> in <code>{tableName}</code> before inserting.</p>
                <Input
                  placeholder={`Type "${tableName}" to confirm`}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={importing}
                />
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={importing}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || rows.length === 0 || (mode === 'replace' && confirmText !== tableName)}
          >
            {importing && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
