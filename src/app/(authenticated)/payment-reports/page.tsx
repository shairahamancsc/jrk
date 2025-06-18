
"use client";

import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { CalendarIcon, Loader2, AlertTriangle, Banknote, Calculator, CreditCard, CheckCircle } from 'lucide-react';
import type { PaymentReportEntry, PaymentHistoryEntry } from '@/types';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recordPaymentSchema, type RecordPaymentFormData } from '@/schemas/payment-schema';
import { useToast } from '@/hooks/use-toast';


export default function PaymentReportsPage() {
  const { laborProfiles, attendanceEntries, isLoading: dataContextLoading, addPaymentHistoryEntry } = useData();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [reportData, setReportData] = useState<PaymentReportEntry[] | null>(null);
  const [grossTotal, setGrossTotal] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [clientLoading, setClientLoading] = useState(true);

  const [isRecordPaymentDialogOpen, setIsRecordPaymentDialogOpen] = useState(false);
  const [selectedLaborForPayment, setSelectedLaborForPayment] = useState<PaymentReportEntry | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const paymentForm = useForm<RecordPaymentFormData>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      paymentDate: new Date(),
      amountPaid: 0,
      notes: "",
    },
  });

  useEffect(() => {
    if (!dataContextLoading) {
      setClientLoading(false);
    }
  }, [dataContextLoading]);

  const handleGenerateReport = () => {
    if (!startDate || !endDate) {
      setCalculationError("Please select both a start and end date for the report.");
      setReportData(null);
      return;
    }
    if (endDate < startDate) {
      setCalculationError("End date cannot be earlier than the start date.");
      setReportData(null);
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);
    setReportData(null);

    try {
      const sDate = startOfDay(startDate);
      const eDate = endOfDay(endDate);

      const filteredAttendance = attendanceEntries.filter(entry => {
        const entryDate = parseISO(entry.date);
        return isWithinInterval(entryDate, { start: sDate, end: eDate });
      });

      const newReportData: PaymentReportEntry[] = laborProfiles.map(profile => {
        const relevantAttendance = filteredAttendance.filter(att => att.labor_id === profile.id);
        
        const presentDays = relevantAttendance.filter(att => att.status === 'present').length;
        const dailySalary = profile.daily_salary || 0;
        const totalEarnings = presentDays * dailySalary;
        
        const totalAdvance = relevantAttendance.reduce((sum, att) => {
          return sum + (att.advance_amount || 0);
        }, 0);
        
        const netPayment = totalEarnings - totalAdvance;

        return {
          laborId: profile.id,
          laborName: profile.name,
          dailySalary: dailySalary,
          presentDays,
          totalEarnings,
          totalAdvance,
          netPayment,
        };
      });

      const newGrossTotal = newReportData.reduce((sum, entry) => sum + entry.netPayment, 0);

      setReportData(newReportData);
      setGrossTotal(newGrossTotal);
    } catch (error) {
      console.error("Error generating report:", error);
      setCalculationError("An unexpected error occurred while generating the report.");
    } finally {
      setIsCalculating(false);
    }
  };
  
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const handleOpenRecordPaymentDialog = (laborEntry: PaymentReportEntry) => {
    if (!startDate || !endDate) return; // Should not happen if button is enabled
    setSelectedLaborForPayment(laborEntry);
    paymentForm.reset({
      laborId: laborEntry.laborId,
      laborName: laborEntry.laborName,
      paymentDate: new Date(),
      periodStartDate: startDate,
      periodEndDate: endDate,
      amountPaid: laborEntry.netPayment > 0 ? laborEntry.netPayment : 0,
      notes: "",
    });
    setIsRecordPaymentDialogOpen(true);
  };

  const onSubmitPaymentRecord = async (formData: RecordPaymentFormData) => {
    if (!selectedLaborForPayment || !startDate || !endDate) return;
    setIsSubmittingPayment(true);

    const paymentDataToSave: Omit<PaymentHistoryEntry, 'id' | 'created_at' | 'user_id'> = {
      labor_id: selectedLaborForPayment.laborId,
      labor_name: selectedLaborForPayment.laborName,
      payment_date: formData.paymentDate.toISOString(),
      period_start_date: startDate.toISOString(),
      period_end_date: endDate.toISOString(),
      amount_paid: formData.amountPaid,
      notes: formData.notes,
    };

    try {
      await addPaymentHistoryEntry(paymentDataToSave);
      // Optionally, re-fetch payment history or update reportData to reflect payment
      // For now, just close dialog and show toast (toast is handled in DataContext)
      setIsRecordPaymentDialogOpen(false);
      setSelectedLaborForPayment(null);
      // Potentially disable the button for this entry on the report or show "Paid"
    } catch (error) {
      console.error("Error submitting payment record:", error);
      // Toast for error is handled by DataContext or can be added here
    } finally {
      setIsSubmittingPayment(false);
    }
  };


  if (clientLoading || dataContextLoading) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14)-2*theme(spacing.4))] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <Calculator size={32} /> Payment Reports
        </h1>
        <p className="text-muted-foreground">
          Generate payment reports and record payments for labor based on attendance and advances.
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Select Date Range</CardTitle>
          <CardDescription>Choose the start and end dates for the payment period.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[280px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                  disabled={isCalculating}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[280px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                  disabled={isCalculating}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick an end date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => date > new Date() || date < new Date("2000-01-01") || (startDate && date < startDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button 
            onClick={handleGenerateReport} 
            disabled={isCalculating || !startDate || !endDate}
            className="bg-primary hover:bg-primary/90"
          >
            {isCalculating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCalculating ? "Generating..." : "Generate Report"}
          </Button>
          {calculationError && (
            <div className="flex items-center gap-2 text-destructive p-3 bg-destructive/10 rounded-md">
              <AlertTriangle size={18} />
              <p className="text-sm font-medium">{calculationError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {reportData && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-primary font-headline">
                <Banknote /> Report Results
            </CardTitle>
            <CardDescription>
                Payment details for {startDate ? format(startDate, "PP") : ""} - {endDate ? format(endDate, "PP") : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Labor Name</TableHead>
                      <TableHead className="text-right">Net Amount Due</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((entry) => (
                      <TableRow key={entry.laborId}>
                        <TableCell className="font-medium">{entry.laborName}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">{formatCurrency(entry.netPayment)}</TableCell>
                        <TableCell className="text-center">
                          {entry.netPayment > 0 ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenRecordPaymentDialog(entry)}
                              disabled={!startDate || !endDate}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Record Payment
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No payment due</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No payment data found for the selected criteria or no labor profiles available.</p>
            )}
          </CardContent>
          {reportData.length > 0 && (
            <CardFooter className="flex flex-col items-end pt-6 border-t">
                <div className="text-right">
                    <p className="text-lg font-semibold text-primary">Gross Total Amount to be Paid:</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(grossTotal)}</p>
                </div>
            </CardFooter>
          )}
        </Card>
      )}

      {selectedLaborForPayment && startDate && endDate && (
        <Dialog open={isRecordPaymentDialogOpen} onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedLaborForPayment(null);
            setIsRecordPaymentDialogOpen(isOpen);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard /> Record Payment for {selectedLaborForPayment.laborName}
              </DialogTitle>
              <DialogDescription>
                Period: {format(startDate, "PP")} - {format(endDate, "PP")}
              </DialogDescription>
            </DialogHeader>
            <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit(onSubmitPaymentRecord)} className="space-y-4 py-2">
                <FormField
                  control={paymentForm.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Payment Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="amountPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Paid (₹)</FormLabel>
                      <FormControl>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground flex items-center justify-center">₹</span>
                            <Input 
                                type="number" 
                                placeholder="Enter amount" 
                                {...field} 
                                className="pl-7"
                                step="0.01"
                            />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter any notes for this payment" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsRecordPaymentDialogOpen(false);
                      setSelectedLaborForPayment(null);
                    }}
                    disabled={isSubmittingPayment}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingPayment} className="bg-primary hover:bg-primary/90">
                    {isSubmittingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmittingPayment ? "Recording..." : "Record Payment"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
