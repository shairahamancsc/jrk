"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '@/contexts/data-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AttendanceEntry } from '@/types';
import { format } from 'date-fns';
import { CalendarDays, ListFilter, Loader2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';

export default function DashboardPage() {
  const { attendanceEntries, laborProfiles, isLoading: dataLoading } = useData();
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
        const entryDate = new Date(entry.date);
        const isSameDate = selectedDate ? 
          entryDate.getFullYear() === selectedDate.getFullYear() &&
          entryDate.getMonth() === selectedDate.getMonth() &&
          entryDate.getDate() === selectedDate.getDate()
          : true;
        
        const labor = laborProfiles.find(lp => lp.id === entry.laborId);
        const matchesSearch = searchTerm ? 
          (labor?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           entry.workDetails.toLowerCase().includes(searchTerm.toLowerCase()))
          : true;

        return isSameDate && matchesSearch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [attendanceEntries, laborProfiles, selectedDate, searchTerm]);

  const getStatusColor = (status: AttendanceEntry['status']) => {
    switch (status) {
      case 'present': return 'bg-green-500 hover:bg-green-600';
      case 'absent': return 'bg-red-500 hover:bg-red-600';
      case 'advance': return 'bg-yellow-500 hover:bg-yellow-600 text-black';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };
  
  if (clientLoading) {
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
        <div className="flex items-center gap-2">
          <Input 
            placeholder="Search by name or work..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-[280px] justify-start text-left font-normal"
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
                    <TableHead>Recorded At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => {
                    const labor = laborProfiles.find(lp => lp.id === entry.laborId);
                    return (
                      <TableRow key={entry.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{labor?.name || entry.laborName || 'N/A'}</TableCell>
                        <TableCell>{format(new Date(entry.date), "PP")}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(entry.status)} text-xs text-white`}>
                            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{entry.workDetails}</TableCell>
                        <TableCell>{format(new Date(entry.createdAt), "Pp")}</TableCell>
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
