
import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, Plus, Minus, Edit, History, Truck } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/formatters";
import { ProductForm } from "@/components/products/ProductForm";
import { StockEntryForm } from "@/components/inventory/StockEntryForm";
import { StockOutputForm } from "@/components/inventory/StockOutputForm";
import { StockEntryList } from "@/components/inventory/StockEntryList";
import { StockOutputList } from "@/components/inventory/StockOutputList";
import { getProductById, deleteProduct } from "@/services/productService";
import { Product as SupabaseProduct } from "@/types/supabase"; 
import { Product as ModelProduct } from "@/types/models";
import { toast } from "sonner";

const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<SupabaseProduct | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;
      
      setLoading(true);
      try {
        const data = await getProductById(productId);
        setProduct(data);
      } catch (error) {
        console.error("Failed to load product:", error);
        toast.error("Failed to load product details");
      } finally {
        setLoading(false);
      }
    }
    
    loadProduct();
  }, [productId, refreshKey]);
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  const handleDeleteProduct = async () => {
    if (!product) return;
    
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await deleteProduct(product.id);
        toast.success(`Product ${product.name} deleted successfully`);
        navigate("/products");
      } catch (error) {
        toast.error("Failed to delete product");
      }
    }
  };
  
  const handleEditSuccess = () => {
    setIsEditing(false);
    handleRefresh();
  };
  
  // Convert to models.Product for compatibility with components
  const convertToModelProduct = (product: SupabaseProduct): ModelProduct => {
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      units: product.units || "",
      current_stock: product.current_stock,
      average_cost: product.average_cost,
      created_at: product.created_at || new Date().toISOString(),
      updated_at: product.updated_at || new Date().toISOString()
    };
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-6">
          <div className="flex justify-center py-12">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </main>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-medium">Product not found</h2>
            <p className="text-muted-foreground mt-1">
              The product you're looking for doesn't exist or has been removed
            </p>
            <Button asChild className="mt-4">
              <Link to="/products">
                <ArrowLeft className="h-4 w-4 mr-2" /> Retour aux produits -العودة إلى المنتجات 
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }
  
  const modelProduct = convertToModelProduct(product);
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/products">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Retour aux produits -العودة إلى المنتجات     
                </Link>
              </Button>
            </div>
            
            {!isEditing && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />Modifier le produit - تعديل المنتج
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDeleteProduct}
                >
                  Supprimer - حذف
                </Button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>Modifier le produit - تعديل المنتج</CardTitle>
                <CardDescription>
                Modifier le produit - تعديل المنتج {product.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductForm 
                  initialData={product} 
                  onSuccess={handleEditSuccess} 
                />
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)} 
                  className="mt-4"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Product details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{product.name}</CardTitle>
                  <CardDescription>
                  Code produit: {product.sku}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground"> Le stock actuel المخزون الحالي</p>
                      <h3 className="text-2xl font-bold">{product.current_stock}  {product.units}</h3>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Coût moyen - متوسط التكلفة</p>
                      <h3 className="text-2xl font-bold">{formatCurrency(product.average_cost)}</h3>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Valeur totale - القيمة الإجمالية</p>
                      <h3 className="text-2xl font-bold">{formatCurrency(product.current_stock * product.average_cost)}</h3>
                    </div>
                  </div>
                  
                  {product.description && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-1">Description - الوصف</h4>
                      <p className="text-muted-foreground">{product.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Tabs for different actions */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="overview" className="flex items-center">
                    <Package className="h-4 w-4 mr-2" />opération  - عمليات 
                  </TabsTrigger>
                  <TabsTrigger value="add-stock" className="flex items-center bg-green-500 text-white hover:bg-green-600 rounded-md px-3 py-1">
                    <Plus className="h-4 w-4 mr-2" /> Ajouter + زيادة
                  </TabsTrigger>
                  <TabsTrigger value="remove-stock" className="flex items-center bg-red-500 text-white hover:bg-red-600 rounded-md px-3 py-1">
                    <Minus className="h-4 w-4 mr-2" /> Retirer  - إخراج
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6">
                  <StockEntryList product={modelProduct} />
                  <StockOutputList product={modelProduct} />
                </TabsContent>
                
                <TabsContent value="add-stock">
                  <Card className="border-[3px] border-green-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" /> Ajouter + زيادة
                      </CardTitle>
                      <CardDescription>
                      Ajouter un nouveau stock pour ce produit - إضافة مخزون مخزون جديد لهذا المنتج
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StockEntryForm 
                        product={modelProduct} 
                        onSuccess={() => {
                          setActiveTab("overview");
                          handleRefresh();
                        }} 
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="remove-stock">
                  <Card className="border-[3px] border-red-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" /> Retirer  - إخراج
                      </CardTitle>
                      <CardDescription>
                      Retirer  - إخراج
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StockOutputForm 
                        product={modelProduct} 
                        onSuccess={() => {
                          setActiveTab("overview");
                          handleRefresh();
                        }} 
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProductDetailPage;
