
import { StockOutput, Product } from "@/types/inventory";
import { useInventoryStore } from "@/store/inventoryStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Package } from "lucide-react";

interface StockOutputListProps {
  product: Product;
}

export function StockOutputList({ product }: StockOutputListProps) {
  const { getStockOutputsForProduct } = useInventoryStore();
  const stockOutputs = getStockOutputsForProduct(product.id);
  
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockOutputs.map((output) => (
              <TableRow key={output.id}>
                <TableCell>{formatDate(output.outputDate)}</TableCell>
                <TableCell>{output.totalQuantity}</TableCell>
                <TableCell>{output.referenceNumber || "-"}</TableCell>
                <TableCell>{formatCurrency(output.totalCost)}</TableCell>
                <TableCell>
                  {formatCurrency(output.totalCost / output.totalQuantity)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
