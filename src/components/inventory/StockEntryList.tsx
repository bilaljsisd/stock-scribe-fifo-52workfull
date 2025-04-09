
import { useState, useEffect } from "react";
import { Product, StockEntry } from "@/types/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Package } from "lucide-react";
import { getStockEntriesForProduct } from "@/services/stockEntryService";

interface StockEntryListProps {
  product: Product;
}

export function StockEntryList({ product }: StockEntryListProps) {
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadStockEntries() {
      setLoading(true);
      const entries = await getStockEntriesForProduct(product.id);
      setStockEntries(entries);
      setLoading(false);
    }
    
    loadStockEntries();
  }, [product.id]);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stock Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (stockEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stock Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium">No stock entries yet</h3>
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
        <CardTitle className="text-lg">Stock Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Total Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockEntries.map((entry) => (
              <TableRow key={entry.id} className={entry.remaining_quantity === 0 ? "bg-muted/50" : ""}>
                <TableCell>{formatDate(new Date(entry.entry_date))}</TableCell>
                <TableCell>{entry.quantity}</TableCell>
                <TableCell>
                  <span className={entry.remaining_quantity === 0 ? "text-muted-foreground" : ""}>
                    {entry.remaining_quantity}
                  </span>
                </TableCell>
                <TableCell>{formatCurrency(entry.unit_price)}</TableCell>
                <TableCell>{formatCurrency(entry.remaining_quantity * entry.unit_price)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
