
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Product } from "@/types/supabase";
import { createStockOutput } from "@/services/stockOutputService";
import { toast } from "sonner";

const stockOutputSchema = z.object({
  quantity: z.number().positive({ message: "Quantity must be greater than 0." }),
  outputDate: z.date({ required_error: "Please select a date." }),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type StockOutputFormValues = z.infer<typeof stockOutputSchema>;

interface StockOutputFormProps {
  product: Product;
  onSuccess?: () => void;
}

export function StockOutputForm({ product, onSuccess }: StockOutputFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<StockOutputFormValues>({
    resolver: zodResolver(stockOutputSchema),
    defaultValues: {
      quantity: undefined,
      outputDate: new Date(),
      referenceNumber: "",
      notes: "",
    },
  });

  async function onSubmit(data: StockOutputFormValues) {
    setIsSubmitting(true);
    
    try {
      // Validate that we have enough stock
      if (data.quantity > product.current_stock) {
        toast.error(`Not enough stock. Only ${product.current_stock} units available.`);
        setIsSubmitting(false);
        return;
      }
      
      const result = await createStockOutput(
        product.id,
        data.quantity,
        data.outputDate.toISOString(),
        data.referenceNumber || undefined,
        data.notes || undefined
      );
      
      if (result) {
        form.reset();
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Enter quantity to withdraw" 
                  {...field} 
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormDescription>
                Available: {product.current_stock} units
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="outputDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="referenceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reference Number (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Order #12345" {...field} />
              </FormControl>
              <FormDescription>
                Order number, invoice number, etc.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional information about this withdrawal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting} variant="default" className="bg-inventory-600 hover:bg-inventory-700">
          {isSubmitting ? "Processing..." : "Withdraw Stock (FIFO)"}
        </Button>
      </form>
    </Form>
  );
}
