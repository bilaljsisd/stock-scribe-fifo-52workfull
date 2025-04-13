
import { useState, useEffect } from "react";
import { Product, StockOutput } from "@/types/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Edit, Eye, Package, Printer } from "lucide-react";
import { getStockOutputsForProduct } from "@/services/stockOutputService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EditStockOutputDialog } from "./EditStockOutputDialog";
import { ViewStockOutputDetailsDialog } from "./ViewStockOutputDetailsDialog";

interface StockOutputListProps {
  product: Product;
  stockOutputs?: StockOutput[];
}

export function StockOutputList({ product, stockOutputs: initialStockOutputs }: StockOutputListProps) {
  const [stockOutputs, setStockOutputs] = useState<StockOutput[]>(initialStockOutputs || []);
  const [loading, setLoading] = useState(!initialStockOutputs);
  const [editingOutput, setEditingOutput] = useState<StockOutput | null>(null);
  const [viewingOutput, setViewingOutput] = useState<StockOutput | null>(null);
  
  useEffect(() => {
    if (!initialStockOutputs) {
      loadStockOutputs();
    }
  }, [product.id, initialStockOutputs]);
  
  async function loadStockOutputs() {
    setLoading(true);
    const outputs = await getStockOutputsForProduct(product.id);
    setStockOutputs(outputs);
    setLoading(false);
  }
  
  const handlePrint = (output: StockOutput) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    const printContent = `
      <html>
      <head>
        <title>Stock Withdrawal Details</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          .header { margin-bottom: 20px; }
          .detail { margin-bottom: 5px; }
          .label { font-weight: bold; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f5f5f5; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Stock Withdrawal Details</h1>
          <div class="detail"><span class="label">Date:</span> ${formatDate(new Date(output.output_date))}</div>
          <div class="detail"><span class="label">Product:</span> ${product.name} (SKU: ${product.sku})</div>
          <div class="detail"><span class="label">Reference Number:</span> ${output.reference_number || 'None'}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Quantity</th>
              <th>Total Cost</th>
              <th>Average Unit Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${output.total_quantity}</td>
              <td>${formatCurrency(output.total_cost)}</td>
              <td>${formatCurrency(output.total_cost / output.total_quantity)}</td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 20px;">
          <div class="detail"><span class="label">Notes:</span> ${output.notes || 'None'}</div>
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
          <p>Report generated on ${formatDate(new Date())}</p>
          <button onclick="window.print();" style="padding: 10px 20px; background: #4F46E5; color: white; border: none; border-radius: 5px; cursor: pointer;">Print</button>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = function() {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  const handleUpdate = (output: StockOutput) => {
    setEditingOutput(output);
  };
  
  const handleViewDetails = (output: StockOutput) => {
    setViewingOutput(output);
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stock Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (stockOutputs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stock Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium">No withdrawals yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Use the form above to withdraw inventory from this product
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Stock Withdrawals</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Avg. Unit Cost</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockOutputs.map((output) => (
              <TableRow key={output.id}>
                <TableCell>{formatDate(new Date(output.output_date))}</TableCell>
                <TableCell>{output.total_quantity}</TableCell>
                <TableCell>{output.reference_number || "-"}</TableCell>
                <TableCell>{formatCurrency(output.total_cost)}</TableCell>
                <TableCell>
                  {formatCurrency(output.total_cost / output.total_quantity)}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleViewDetails(output)}
                      title="See FIFO Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handlePrint(output)}
                      title="Print"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleUpdate(output)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {editingOutput && (
          <EditStockOutputDialog
            stockOutput={editingOutput}
            open={!!editingOutput}
            onOpenChange={(open) => !open && setEditingOutput(null)}
            onSuccess={loadStockOutputs}
          />
        )}
        
        <ViewStockOutputDetailsDialog
          stockOutput={viewingOutput}
          open={!!viewingOutput}
          onOpenChange={(open) => !open && setViewingOutput(null)}
        />
      </CardContent>
    </Card>
  );
}
