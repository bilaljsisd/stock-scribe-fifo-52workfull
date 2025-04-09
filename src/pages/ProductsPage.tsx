
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Search, Package } from "lucide-react";
import { useInventoryStore } from "@/store/inventoryStore";
import { ProductCard } from "@/components/products/ProductCard";
import { Input } from "@/components/ui/input";

const ProductsPage = () => {
  const { products } = useInventoryStore();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <div className="flex items-center gap-4">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full md:w-[250px] pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button asChild>
                <Link to="/products/new">
                  <Plus className="h-4 w-4 mr-2" /> Add Product
                </Link>
              </Button>
            </div>
          </div>
          
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-16 w-16 text-gray-300 mb-4" />
              {searchQuery ? (
                <>
                  <h2 className="text-xl font-medium">No products found</h2>
                  <p className="text-muted-foreground mt-1">
                    Try a different search term or add a new product
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-medium">No products yet</h2>
                  <p className="text-muted-foreground mt-1">
                    Get started by adding your first product
                  </p>
                  <Button asChild className="mt-4">
                    <Link to="/products/new">
                      <Plus className="h-4 w-4 mr-2" /> Add Product
                    </Link>
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProductsPage;
