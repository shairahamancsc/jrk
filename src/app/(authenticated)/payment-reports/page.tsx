
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { CalendarIcon, Loader2, AlertTriangle, Banknote, Calculator } from 'lucide-react';
import type { PaymentReportEntry } from '@/types';
import { cn } from '@/lib/utils';

export default function PaymentReportsPage() {
  const { laborProfiles, attendanceEntries, isLoading: dataContextLoading } = useData();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [reportData, setReportData] = useState<PaymentReportEntry[] | null>(null);
  const [grossTotal, setGrossTotal] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [clientLoading, setClientLoading] = useState(true);

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
          Generate payment reports for labor based on attendance and advances within a selected date range.
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
                      <TableHead className="text-right">Daily Salary</TableHead>
                      <TableHead className="text-right">Present Days</TableHead>
                      <TableHead className="text-right">Total Earnings</TableHead>
                      <TableHead className="text-right">Total Advance</TableHead>
                      <TableHead className="text-right font-semibold">Net Amount Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((entry) => (
                      <TableRow key={entry.laborId}>
                        <TableCell className="font-medium">{entry.laborName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.dailySalary)}</TableCell>
                        <TableCell className="text-right">{entry.presentDays}</TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.totalEarnings)}</TableCell>
                        <TableCell className="text-right text-red-600 dark:text-red-500">{formatCurrency(entry.totalAdvance)}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">{formatCurrency(entry.netPayment)}</TableCell>
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
    </div>
  );
}
