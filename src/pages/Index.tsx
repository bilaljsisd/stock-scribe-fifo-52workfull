
import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Package, TrendingUp, ArrowUpRight, ArrowDownRight, Plus, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { ProductCard } from "@/components/products/ProductCard";
import { getProducts } from "@/services/productService";
import { getAllTransactions } from "@/services/transactionService";
import { Product, Transaction } from "@/types/supabase";

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [productsData, transactionsData] = await Promise.all([
        getProducts(),
        getAllTransactions()
      ]);
      
      setProducts(productsData);
      setTransactions(transactionsData);
      setLoading(false);
    }
    
    loadData();
  }, []);
  
  // Calculate some statistics
  const totalProducts = products.length;
  const totalInventoryValue = products.reduce(
    (sum, product) => sum + Number(product.average_cost) * product.current_stock, 
    0
  );
  
  // Get recent transactions
  const recentTransactions = transactions
    .slice(0, 5);
  
  // Get low stock products (less than 10 units)
  const lowStockProducts = products
    .filter(product => product.current_stock < 10)
    .slice(0, 4);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-6 flex justify-center items-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <Button asChild>
              <Link to="/products/new">
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Link>
            </Button>
          </div>
          
          {/* Stats cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Products
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  in your inventory
                </p>
              </CardContent>
            </Card>
            
            <Card className="animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Inventory Value
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
                <p className="text-xs text-muted-foreground">
                  based on FIFO valuation
                </p>
              </CardContent>
            </Card>
            
            <Card className="animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Recent Activity
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transactions.length}</div>
                <p className="text-xs text-muted-foreground">
                  total transactions
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent transactions */}
            <Card className="col-span-1 animate-fade-in">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest inventory transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Package className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium">No transactions yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add some products and start managing your inventory
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentTransactions.map((transaction) => {
                      const product = products.find(p => p.id === transaction.product_id);
                      return (
                        <div key={transaction.id} className="flex items-center">
                          <div className={`rounded-full p-2 mr-4 ${
                            transaction.type === 'entry' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {transaction.type === 'entry' ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {transaction.type === 'entry' ? 'Added' : 'Removed'} {transaction.quantity} units / {product.units}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product?.name || 'Unknown Product'}
                            </p>
                          </div>
                          <div className="text-sm text-right">
                            {new Date(transaction.date).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                    
                    <Button asChild variant="outline" size="sm" className="w-full mt-4">
                      <Link to="/reports">
                        View All Transactions <ChevronRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Low stock items */}
            <Card className="col-span-1 animate-fade-in">
              <CardHeader>
                <CardTitle>Low Stock Alert</CardTitle>
                <CardDescription>
                  Products with less than 10 units remaining
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <TrendingUp className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium">No low stock items</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      All your products have sufficient inventory
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lowStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center">
                        <div className="rounded-full p-2 mr-4 bg-red-100 text-red-700">
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {product.sku}
                          </p>
                        </div>
                        <div className={`text-sm font-medium ${
                          product.current_stock === 0 ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {product.current_stock} units
                        </div>
                      </div>
                    ))}
                    
                    <Button asChild variant="outline" size="sm" className="w-full mt-4">
                      <Link to="/products">
                        View All Products <ChevronRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Recent products */}
          {products.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your Products</h2>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/products">
                    View All <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.slice(0, 3).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
