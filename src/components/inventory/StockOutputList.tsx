
import { useState, useEffect } from "react";
import { Product, StockOutput } from "@/types/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Package } from "lucide-react";
import { getStockOutputsForProduct } from "@/services/stockOutputService";

interface StockOutputListProps {
  product: Product;
}

export function StockOutputList({ product }: StockOutputListProps) {
  const [stockOutputs, setStockOutputs] = useState<StockOutput[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadStockOutputs() {
      setLoading(true);
      const outputs = await getStockOutputsForProduct(product.id);
      setStockOutputs(outputs);
      setLoading(false);
    }
    
    loadStockOutputs();
  }, [product.id]);
  
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
