
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useInventoryStore } from "@/store/inventoryStore";
import { Product } from "@/types/inventory";

// Update the schema to make sure all required fields are validated
const productSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  sku: z.string().min(2, { message: "SKU must be at least 2 characters." }),
  description: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Product;
  onSuccess?: () => void;
}

export function ProductForm({ initialData, onSuccess }: ProductFormProps) {
  const { addProduct, updateProduct } = useInventoryStore();
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      description: initialData?.description || "",
    },
  });

  function onSubmit(data: ProductFormValues) {
    try {
      if (initialData) {
        updateProduct({
          ...initialData,
          ...data,
        });
      } else {
        // Ensure all required properties are passed
        const productData = {
          name: data.name,  // Explicitly assigning to ensure it's not optional
          sku: data.sku,    // Explicitly assigning to ensure it's not optional
          description: data.description || "", // Provide default value for optional field
        };
        
        addProduct(productData);
        form.reset();
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("Failed to save product.");
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input placeholder="Enter product SKU" {...field} />
              </FormControl>
              <FormDescription>
                Stock Keeping Unit - a unique identifier for your product
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter product description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">
          {initialData ? "Update Product" : "Add Product"}
        </Button>
      </form>
    </Form>
  );
}
