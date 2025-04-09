
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Product } from "@/types/supabase";
import { addStockEntry } from "@/services/stockEntryService";
import { cn } from "@/lib/utils";

const stockEntrySchema = z.object({
  quantity: z.coerce.number().positive({ message: "Quantity must be greater than 0" }),
  unitPrice: z.coerce.number().positive({ message: "Unit price must be greater than 0" }),
  entryDate: z.date(),
  expiryDate: z.date().optional().nullable(),
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
      quantity: 1,
      unitPrice: product.average_cost > 0 ? product.average_cost : undefined,
      entryDate: new Date(),
      expiryDate: null,
      notes: "",
    },
  });

  async function onSubmit(data: StockEntryFormValues) {
    setIsSubmitting(true);
    try {
      await addStockEntry({
        product_id: product.id,
        quantity: data.quantity,
        unit_price: data.unitPrice,
        entry_date: data.entryDate.toISOString(),
        expiry_date: data.expiryDate ? data.expiryDate.toISOString() : null,
        notes: data.notes || null,
      });
      
      form.reset({
        quantity: 1,
        unitPrice: data.unitPrice,
        entryDate: new Date(),
        expiryDate: null,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input type="number" min="1" step="1" {...field} />
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
                  <Input type="number" min="0.01" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="entryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Entry Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
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
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {product.is_expirable && (
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiry Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
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
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date()
                        }
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When this product will expire
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Add any additional information here" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Stock"}
        </Button>
      </form>
    </Form>
  );
}
