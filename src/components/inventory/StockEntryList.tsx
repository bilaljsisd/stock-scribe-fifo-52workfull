
import { useState, useEffect } from "react";
import { Product, StockEntry } from "@/types/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Edit, Package, Printer, Trash2 } from "lucide-react";
import { getStockEntriesForProduct } from "@/services/stockEntryService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EditStockEntryDialog } from "./EditStockEntryDialog";

interface StockEntryListProps {
  product: Product;
}

export function StockEntryList({ product }: StockEntryListProps) {
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);

  useEffect(() => {
    loadStockEntries();
  }, [product.id]);

  async function loadStockEntries() {
    try {
      setLoading(true);
      setError(null); // Reset any previous errors
      const entries = await getStockEntriesForProduct(product.id);
      setStockEntries(entries);
    } catch (err) {
      setError("Error loading stock entries. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = (entry: StockEntry) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    const printContent = `
      <html>
      <head>
        <title>Stock Entry Details</title>
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
          <h1>Stock Entry Details</h1>
          <div class="detail"><span class="label">Date:</span> ${formatDate(new Date(entry.entry_date))}</div>
          <div class="detail"><span class="label">Product:</span> ${product.name} (SKU: ${product.sku})</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Quantité</th>
              <th>Remaining</th>
              <th>Unit Price</th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${entry.quantity}</td>
              <td>${entry.remaining_quantity !== undefined ? entry.remaining_quantity : entry.quantity}</td>
              <td>${formatCurrency(entry.unit_price)}</td>
              <td>${formatCurrency((entry.remaining_quantity !== undefined ? entry.remaining_quantity : entry.quantity) * entry.unit_price)}</td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 20px;">
          <div class="detail"><span class="label">Notes:</span> ${entry.notes || 'None'}</div>
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

  const handleUpdate = (entry: StockEntry) => {
    setEditingEntry(entry);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Entrées de stock - إدخالات المخزون</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Entrées de stock - إدخالات المخزون</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <h3 className="text-lg font-medium">Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stockEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Entrées de stock - إدخالات المخزون</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium">vide</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Use the form above to add inventory to this product
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Entrées de stock - إدخالات المخزون</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date - يوم</TableHead>
              <TableHead>Quantité - الكمية</TableHead>
              <TableHead>Disponible - المتبقي</TableHead>
              <TableHead>Prix unitaire - سعر الوحدة</TableHead>
              <TableHead>Valeur totale - سعر الكلي</TableHead>
              <TableHead>Actions - تعديلات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockEntries.map((entry) => {
              // Make sure remaining_quantity has a valid value
              const remainingQty = entry.remaining_quantity !== undefined 
                ? entry.remaining_quantity 
                : entry.quantity;
              
              // Calculate total value safely
              const totalValue = remainingQty * entry.unit_price;
              
              return (
                <TableRow key={entry.id} className={remainingQty === 0 ? "bg-muted/50" : ""}>
                  <TableCell>{formatDate(new Date(entry.entry_date))}</TableCell>
                  <TableCell>{entry.quantity}</TableCell>
                  <TableCell>
                    <span className={remainingQty === 0 ? "text-muted-foreground" : ""}>
                      {remainingQty}
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrency(entry.unit_price)}</TableCell>
                  <TableCell>{formatCurrency(totalValue)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handlePrint(entry)}
                        title="Imprimer - طباعة"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleUpdate(entry)}
                        title="Modifier - تعديل"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {editingEntry && (
          <EditStockEntryDialog
            stockEntry={editingEntry}
            open={!!editingEntry}
            onOpenChange={(open) => !open && setEditingEntry(null)}
            onSuccess={loadStockEntries}
          />
        )}
      </CardContent>
    </Card>
  );
}
