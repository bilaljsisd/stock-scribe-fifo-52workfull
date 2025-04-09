
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ProductForm } from "@/components/products/ProductForm";

const NewProductPage = () => {
  const navigate = useNavigate();
  
  const handleSuccess = () => {
    navigate("/products");
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-6">
        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/products">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
              </Link>
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Add New Product</CardTitle>
              <CardDescription>
                Create a new product in your inventory catalog
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductForm onSuccess={handleSuccess} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NewProductPage;
