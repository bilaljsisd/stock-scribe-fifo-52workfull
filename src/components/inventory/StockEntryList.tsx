
import { StockEntry, Product } from "@/types/inventory";
import { useInventoryStore } from "@/store/inventoryStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Package } from "lucide-react";

interface StockEntryListProps {
  product: Product;
}

export function StockEntryList({ product }: StockEntryListProps) {
  const { getStockEntriesForProduct } = useInventoryStore();
  const stockEntries = getStockEntriesForProduct(product.id);
  
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
              <TableRow key={entry.id} className={entry.remainingQuantity === 0 ? "bg-muted/50" : ""}>
                <TableCell>{formatDate(entry.entryDate)}</TableCell>
                <TableCell>{entry.quantity}</TableCell>
                <TableCell>
                  <span className={entry.remainingQuantity === 0 ? "text-muted-foreground" : ""}>
                    {entry.remainingQuantity}
                  </span>
                </TableCell>
                <TableCell>{formatCurrency(entry.unitPrice)}</TableCell>
                <TableCell>{formatCurrency(entry.remainingQuantity * entry.unitPrice)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
