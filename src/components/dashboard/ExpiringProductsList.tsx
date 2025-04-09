
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/formatters";
import { AlertTriangle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getExpiringProducts } from "@/services/dashboardService";

interface ExpiringProduct {
  id: string;
  name: string;
  sku: string;
  expiry_date: string;
  quantity: number;
  days_until_expiry: number;
}

export function ExpiringProductsList() {
  const [products, setProducts] = useState<ExpiringProduct[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadExpiringProducts() {
      setLoading(true);
      const data = await getExpiringProducts();
      setProducts(data);
      setLoading(false);
    }
    
    loadExpiringProducts();
  }, []);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Products Expiring Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Products Expiring Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium">No expiring products</h3>
            <p className="text-sm text-muted-foreground mt-1">
              All your products are within their shelf life
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Products Expiring Soon
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                </TableCell>
                <TableCell>{formatDate(new Date(product.expiry_date))}</TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell>
                  <div className={`px-2 py-1 rounded text-center text-xs font-medium ${
                    product.days_until_expiry <= 7
                      ? 'bg-red-100 text-red-800'
                      : product.days_until_expiry <= 30
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {product.days_until_expiry <= 0
                      ? 'Expired'
                      : product.days_until_expiry === 1
                      ? '1 day left'
                      : `${product.days_until_expiry} days left`}
                  </div>
                </TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/products/${product.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
