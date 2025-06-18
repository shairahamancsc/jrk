
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
      setIsRecordPaymentDialogOpen(false);
      setSelectedLaborForPayment(null);
    } catch (error) {
      console.error("Error submitting payment record:", error);
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
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <Calculator className="h-7 w-7 sm:h-8 sm:w-8" /> Payment Reports
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Generate payment reports and record payments for labor based on attendance and advances.
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Select Date Range</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Choose the start and end dates for the payment period.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
          >
            {isCalculating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCalculating ? "Generating..." : "Generate Report"}
          </Button>
          {calculationError && (
            <div className="flex items-center gap-2 text-destructive p-2 sm:p-3 bg-destructive/10 rounded-md">
              <AlertTriangle className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              <p className="text-xs sm:text-sm font-medium">{calculationError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {reportData && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-primary font-headline">
                <Banknote /> Report Results
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
                Payment details for {startDate ? format(startDate, "PP") : ""} - {endDate ? format(endDate, "PP") : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-2 py-3 md:px-4 text-xs sm:text-sm">Labor Name</TableHead>
                      <TableHead className="text-right px-2 py-3 md:px-4 text-xs sm:text-sm">Net Amount Due</TableHead>
                      <TableHead className="text-center px-2 py-3 md:px-4 text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((entry) => (
                      <TableRow key={entry.laborId}>
                        <TableCell className="font-medium px-2 py-3 md:px-4 text-xs sm:text-sm">{entry.laborName}</TableCell>
                        <TableCell className="text-right font-semibold text-primary px-2 py-3 md:px-4 text-xs sm:text-sm">{formatCurrency(entry.netPayment)}</TableCell>
                        <TableCell className="text-center px-2 py-3 md:px-4">
                          {entry.netPayment > 0 ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => handleOpenRecordPaymentDialog(entry)}
                              disabled={!startDate || !endDate}
                            >
                              <CreditCard className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
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
              <p className="text-center text-muted-foreground py-8 text-sm sm:text-base">No payment data found for the selected criteria or no labor profiles available.</p>
            )}
          </CardContent>
          {reportData.length > 0 && (
            <CardFooter className="flex flex-col items-end pt-4 sm:pt-6 border-t">
                <div className="text-right">
                    <p className="text-base sm:text-lg font-semibold text-primary">Gross Total Amount to be Paid:</p>
                    <p className="text-xl sm:text-2xl font-bold text-primary">{formatCurrency(grossTotal)}</p>
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
          <DialogContent className="w-[90vw] max-w-xs sm:max-w-md rounded-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CreditCard /> Record Payment for {selectedLaborForPayment.laborName}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Period: {format(startDate, "PP")} - {format(endDate, "PP")}
              </DialogDescription>
            </DialogHeader>
            <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit(onSubmitPaymentRecord)} className="space-y-3 sm:space-y-4 py-2">
                <FormField
                  control={paymentForm.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs sm:text-sm">Payment Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal text-xs sm:text-sm",
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
                      <FormMessage className="text-xs"/>
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="amountPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Amount Paid (₹)</FormLabel>
                      <FormControl>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground flex items-center justify-center text-xs sm:text-sm">₹</span>
                            <Input 
                                type="number" 
                                placeholder="Enter amount" 
                                {...field} 
                                className="pl-7 text-xs sm:text-sm"
                                step="0.01"
                            />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs"/>
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter any notes for this payment" {...field} className="text-xs sm:text-sm"/>
                      </FormControl>
                      <FormMessage className="text-xs"/>
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-3 sm:pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsRecordPaymentDialogOpen(false);
                      setSelectedLaborForPayment(null);
                    }}
                    disabled={isSubmittingPayment}
                    type="button"
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingPayment} className="bg-primary hover:bg-primary/90" size="sm">
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

