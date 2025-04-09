
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Eye } from "lucide-react";
import { Product } from "@/types/inventory";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/formatters";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{product.name}</CardTitle>
          <div className="bg-inventory-100 text-inventory-800 px-2 py-1 rounded-full text-xs font-medium">
            SKU: {product.sku}
          </div>
        </div>
        <CardDescription className="text-sm line-clamp-2">{product.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Current Stock</span>
            <span className="text-lg font-medium">{product.currentStock}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Average Cost</span>
            <span className="text-lg font-medium">{formatCurrency(product.averageCost)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/20 px-4 py-3">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to={`/products/${product.id}`}>
            <Eye className="h-4 w-4 mr-2" /> View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
