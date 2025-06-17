
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '@/contexts/data-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AttendanceEntry, AttendanceStatus } from '@/types'; // Ensure this imports the updated types
import { format, parseISO, isEqual, startOfDay } from 'date-fns';
import { CalendarDays, ListFilter, Loader2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';

export default function DashboardPage() {
  const { attendanceEntries, isLoading: dataLoading } = useData(); // laborProfiles not directly needed here if labor_name is on entry
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [clientLoading, setClientLoading] = useState(true);

 useEffect(() => {
    if (!dataLoading) {
      setClientLoading(false);
    }
  }, [dataLoading]);


  const filteredEntries = useMemo(() => {
    return attendanceEntries
      .filter(entry => {
        const entryDate = startOfDay(parseISO(entry.date)); // Compare start of day for consistency
        const isSameDate = selectedDate ? 
          isEqual(entryDate, startOfDay(selectedDate))
          : true;
        
        const lowerSearchTerm = searchTerm.toLowerCase();
        const matchesSearch = searchTerm ? 
          ((entry.labor_name || '').toLowerCase().includes(lowerSearchTerm) || 
           (entry.work_details || '').toLowerCase().includes(lowerSearchTerm))
          : true;

        return isSameDate && matchesSearch;
      })
      .sort((a, b) => parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime());
  }, [attendanceEntries, selectedDate, searchTerm]);

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'bg-green-500 hover:bg-green-600';
      case 'absent': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getWorkDetailsDisplay = (workDetails?: string) => {
    return workDetails || 'N/A';
  };
  
  if (clientLoading || dataLoading) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14)-2*theme(spacing.4))] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-headline font-bold text-primary">Daily Attendance Dashboard</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <Input 
            placeholder="Search by name or work details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-xs"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full sm:w-[280px] justify-start text-left font-normal"
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-primary">
            <ListFilter />
            Entries for {selectedDate ? format(selectedDate, "MMMM dd, yyyy") : 'All Dates'}
          </CardTitle>
          <CardDescription>
            Showing {filteredEntries.length} attendance record(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Labor Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Work Details</TableHead>
                    <TableHead>Advance Amount</TableHead>
                    <TableHead>Recorded At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => {
                    return (
                      <TableRow key={entry.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{entry.labor_name || 'N/A'}</TableCell>
                        <TableCell>{format(parseISO(entry.date), "PP")}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(entry.status)} text-xs text-white`}>
                            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{getWorkDetailsDisplay(entry.work_details)}</TableCell>
                        <TableCell>
                          {entry.advance_amount !== undefined && entry.advance_amount !== null && entry.advance_amount > 0
                            ? `₹${entry.advance_amount.toFixed(2)}` 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{format(parseISO(entry.created_at), "Pp")}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No attendance records found for the selected criteria.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
