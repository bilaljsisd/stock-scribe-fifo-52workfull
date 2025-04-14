
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
import { addStockEntry } from "@/services/stockEntryService";

const stockEntrySchema = z.object({
  quantity: z.coerce.number().positive({ message: "Quantity must be greater than 0." }),
  unitPrice: z.coerce.number().nonnegative({ message: "Unit price must be 0 or greater." }),
  entryDate: z.date({ required_error: "Please select a date." }),
  notes: z.string().optional(),
});

type StockEntryFormValues = z.infer<typeof stockEntrySchema>;

interface StockEntryFormProps {
  product: Product;
  onSuccess?: () => void;
}

export function StockEntryForm({ product, onSuccess }: StockEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<StockEntryFormValues>({
    resolver: zodResolver(stockEntrySchema),
    defaultValues: {
      quantity: 0,
      unitPrice: 0,
      entryDate: new Date(),
      notes: "",
    },
  });

  async function onSubmit(data: StockEntryFormValues) {
    setIsSubmitting(true);
    try {
      await addStockEntry({
        product_id: product.id,
        quantity: data.quantity,
        remaining_quantity: data.quantity,
        unit_price: data.unitPrice,
        entry_date: data.entryDate.toISOString(),
        notes: data.notes || null,
        remaining_quantity: data.quantity, // Add the remaining_quantity field with the same value as quantity
      });
      
      form.reset({
        quantity: 0,
        unitPrice: 0,
        entryDate: new Date(),
        notes: "",
      });
      
      if (onSuccess) {
        onSuccess();
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
                  placeholder="Enter quantity" 
                  {...field} 
                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="unitPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit Price</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="Enter unit price" 
                  {...field} 
                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="entryDate"
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional notes about this stock entry" {...field} />
              </FormControl>
              <FormDescription>
                Add any additional information about this inventory entry
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Stock Entry"}
        </Button>
      </form>
    </Form>
  );
}
