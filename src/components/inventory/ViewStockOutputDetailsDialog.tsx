
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { StockOutput } from "@/types/supabase";
import { getStockOutputLines } from "@/services/stockOutputService";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewStockOutputDetailsDialogProps {
  stockOutput: StockOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StockOutputLine {
  id: string;
  stock_output_id: string;
  stock_entry_id: string;
  quantity: number;
  unit_price: number;
  stock_entry: {
    id: string;
    entry_date: string;
    supplier: string | null;
    invoice_number: string | null;
    notes: string | null;
  };
}

export function ViewStockOutputDetailsDialog({ 
  stockOutput, 
  open, 
  onOpenChange 
}: ViewStockOutputDetailsDialogProps) {
  const [lines, setLines] = useState<StockOutputLine[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (open && stockOutput) {
      loadOutputLines();
    }
  }, [open, stockOutput]);
  
  async function loadOutputLines() {
    setLoading(true);
    if (stockOutput) {
      const outputLines = await getStockOutputLines(stockOutput.id);
      setLines(outputLines);
    }
    setLoading(false);
  }
  
  if (!stockOutput) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>FIFO Allocation Details</DialogTitle>
          <DialogDescription>
            Stock batches used for this withdrawal using the First-In, First-Out method
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Date</p>
            <p className="text-sm">{formatDate(new Date(stockOutput.output_date))}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Reference</p>
            <p className="text-sm">{stockOutput.reference_number || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Quantity</p>
            <p className="text-sm">{stockOutput.total_quantity}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
            <p className="text-sm">{formatCurrency(stockOutput.total_cost)}</p>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : lines.length === 0 ? (
          <div className="text-center py-6">
            <p>No detailed records found for this withdrawal</p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entry Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.stock_entry ? formatDate(new Date(line.stock_entry.entry_date)) : "-"}</TableCell>
                    <TableCell>
                      {line.stock_entry && line.stock_entry.notes ? line.stock_entry.notes : "-"}
                    </TableCell>
                    <TableCell>{line.quantity}</TableCell>
                    <TableCell>{formatCurrency(line.unit_price)}</TableCell>
                    <TableCell>{formatCurrency(line.quantity * line.unit_price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
