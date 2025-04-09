
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { StockEntry } from "@/types/supabase";
import { updateStockEntry, deleteStockEntry } from "@/services/stockEntryService";
import { toast } from "sonner";

// Define the schema outside the component to avoid recreation on each render
const createStockEntrySchema = (stockEntry: StockEntry) => {
  return z.object({
    quantity: z.coerce.number().positive({ message: "Quantity must be greater than 0." }).refine(
      (val) => {
        // Can't reduce below what has been consumed
        const consumedQuantity = stockEntry.quantity - stockEntry.remaining_quantity;
        return val >= consumedQuantity;
      },
      {
        message: "Cannot reduce quantity below what has already been consumed.",
      }
    ),
    unitPrice: z.coerce.number().nonnegative({ message: "Unit price must be 0 or greater." }),
    entryDate: z.date({ required_error: "Please select a date." }),
    notes: z.string().optional(),
  });
};

type StockEntryFormValues = z.infer<ReturnType<typeof createStockEntrySchema>>;

interface EditStockEntryDialogProps {
  stockEntry: StockEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditStockEntryDialog({ stockEntry, open, onOpenChange, onSuccess }: EditStockEntryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const form = useForm<StockEntryFormValues>({
    resolver: zodResolver(createStockEntrySchema(stockEntry)),
    defaultValues: {
      quantity: stockEntry.quantity,
      unitPrice: stockEntry.unit_price,
      entryDate: new Date(stockEntry.entry_date),
      notes: stockEntry.notes || "",
    },
  });

  async function onSubmit(data: StockEntryFormValues) {
    setIsSubmitting(true);
    try {
      await updateStockEntry({
        id: stockEntry.id,
        quantity: data.quantity,
        unit_price: data.unitPrice,
        entry_date: data.entryDate.toISOString(),
        notes: data.notes || null,
      });
      
      toast.success("Stock entry updated successfully");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update stock entry");
    } finally {
      setIsSubmitting(false);
    }
  }
  
  async function handleDelete() {
    if (stockEntry.remaining_quantity < stockEntry.quantity) {
      toast.error("Cannot delete entry that has been partially consumed");
      return;
    }
    
    if (confirm("Are you sure you want to delete this stock entry?")) {
      setIsDeleting(true);
      try {
        await deleteStockEntry(stockEntry.id);
        toast.success("Stock entry deleted successfully");
        onOpenChange(false);
        onSuccess();
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete stock entry");
      } finally {
        setIsDeleting(false);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Stock Entry</DialogTitle>
          <DialogDescription>
            Make changes to the stock entry. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
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
                      disabled={stockEntry.remaining_quantity < stockEntry.quantity}
                    />
                  </FormControl>
                  {stockEntry.remaining_quantity < stockEntry.quantity && (
                    <FormDescription>
                      Cannot edit quantity as {stockEntry.quantity - stockEntry.remaining_quantity} units have been consumed
                    </FormDescription>
                  )}
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
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || stockEntry.remaining_quantity < stockEntry.quantity}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
