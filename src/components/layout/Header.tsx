
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LayoutGrid, Package, BarChart, Settings } from "lucide-react";

export function Header() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 md:px-6 gap-4 md:gap-6">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-inventory-700" />
          <span className="text-lg font-semibold">StockScribe FIFO</span>
        </div>
        <nav className="ml-auto flex items-center gap-2 md:gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/products">
              <Package className="h-4 w-4 mr-2" />
              Products
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/reports">
              <BarChart className="h-4 w-4 mr-2" />
              Reports
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
