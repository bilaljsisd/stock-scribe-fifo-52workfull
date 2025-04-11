
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { Link } from "react-router-dom";
import { Product } from "@/types/supabase";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{product.name}</CardTitle>
      </CardHeader>
      <CardContent className="pb-0">
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="text-muted-foreground">SKU: {product.sku}</span>
          <span 
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              product.current_stock > 10 
                ? 'bg-green-100 text-green-800' 
                : product.current_stock > 0 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {product.current_stock > 10 
              ? 'In Stock' 
              : product.current_stock > 0 
                ? 'Low Stock' 
                : 'Out of Stock'}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
          <div>
            <p className="text-muted-foreground">Stock</p>
            <p className="font-medium">{product.current_stock} unit: {product.units}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg. Cost</p>
            <p className="font-medium">{formatCurrency(product.average_cost)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Total Value</p>
            <p className="font-medium">{formatCurrency(product.current_stock * Number(product.average_cost))}</p>
          </div>
        </div>
        
        {product.description && (
          <div className="text-sm mb-4">
            <p className="text-muted-foreground mb-1">Description</p>
            <p className="line-clamp-2">{product.description}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-4">
        <Link 
          to={`/products/${product.id}`}
          className="w-full text-center text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          View Details
        </Link>
      </CardFooter>
    </Card>
  );
}
