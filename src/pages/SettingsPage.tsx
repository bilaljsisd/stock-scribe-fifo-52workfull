
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-6">
        <div className="flex flex-col gap-6 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>About StockScribe FIFO</CardTitle>
              <CardDescription>
                Information about this inventory management application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>FIFO Inventory Method</AlertTitle>
                <AlertDescription>
                  This application uses the First-In, First-Out (FIFO) inventory method. When stock is withdrawn, 
                  the oldest inventory (first entered) is used first, and costs are calculated based on the 
                  actual purchase prices of those specific units.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <h3 className="font-medium">Key Features:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Accurate tracking of inventory levels</li>
                  <li>FIFO-based cost calculations for financial accuracy</li>
                  <li>Product catalog management</li>
                  <li>Detailed transaction history and reporting</li>
                  <li>Low stock alerts</li>
                </ul>
              </div>
              
              <div className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Version 1.0.0
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
