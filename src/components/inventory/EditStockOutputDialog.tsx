
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { StockOutput } from "@/types/supabase";
import { updateStockOutput, deleteStockOutput } from "@/services/stockOutputService";
import { toast } from "sonner";

const stockOutputSchema = z.object({
  outputDate: z.date({ required_error: "Please select a date." }),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

interface EditStockOutputDialogProps {
  stockOutput: StockOutput;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditStockOutputDialog({ stockOutput, open, onOpenChange, onSuccess }: EditStockOutputDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const form = useForm<z.infer<typeof stockOutputSchema>>({
    resolver: zodResolver(stockOutputSchema),
    defaultValues: {
      outputDate: new Date(stockOutput.output_date),
      referenceNumber: stockOutput.reference_number || "",
      notes: stockOutput.notes || "",
    },
  });

  async function onSubmit(data: z.infer<typeof stockOutputSchema>) {
    setIsSubmitting(true);
    try {
      await updateStockOutput({
        id: stockOutput.id,
        output_date: data.outputDate.toISOString(),
        reference_number: data.referenceNumber || null,
        notes: data.notes || null,
      });
      
      toast.success("Stock withdrawal updated successfully");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update stock withdrawal");
    } finally {
      setIsSubmitting(false);
    }
  }
  
  async function handleDelete() {
    if (confirm("Are you sure you want to delete this stock withdrawal? This will return the inventory to stock.")) {
      setIsDeleting(true);
      try {
        await deleteStockOutput(stockOutput.id);
        toast.success("Stock withdrawal deleted successfully");
        onOpenChange(false);
        onSuccess();
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete stock withdrawal");
      } finally {
        setIsDeleting(false);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Stock Withdrawal</DialogTitle>
          <DialogDescription>
            Make changes to the withdrawal record. Quantity cannot be modified as inventory has already been allocated.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <p className="text-muted-foreground p-2 border rounded-md bg-muted/30">
                  {stockOutput.total_quantity} units
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Total Cost</label>
                <p className="text-muted-foreground p-2 border rounded-md bg-muted/30">
                  ${stockOutput.total_cost.toFixed(2)}
                </p>
              </div>
            </div>
            
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
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Order #12345" {...field} />
                  </FormControl>
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
                    <Textarea placeholder="Additional information about this withdrawal" {...field} />
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
                disabled={isDeleting}
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
