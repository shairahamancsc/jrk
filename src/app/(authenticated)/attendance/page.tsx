
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { AttendanceForm } from '@/components/attendance/attendance-form';
import { useData } from '@/contexts/data-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AttendanceEntry, AttendanceStatus } from '@/types';
import { format, parseISO } from 'date-fns';
import { ListOrdered, Loader2 } from 'lucide-react';

export default function AttendancePage() {
  const { attendanceEntries, laborProfiles, isLoading: dataLoading } = useData(); // laborProfiles is needed by AttendanceForm
  const [clientLoading, setClientLoading] = useState(true);

  useEffect(() => {
    if (!dataLoading) {
      setClientLoading(false);
    }
  }, [dataLoading]);

  const recentEntries = useMemo(() => {
    return [...attendanceEntries]
      .sort((a, b) => parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime())
      .slice(0, 10); 
  }, [attendanceEntries]);

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
    <div className="space-y-8">
      <h1 className="text-3xl font-headline font-bold text-primary">Daily Attendance Entry</h1>
      
      <AttendanceForm /> {/* LaborProfiles is used within AttendanceForm via useData() */}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-primary font-headline">
            <ListOrdered /> Recent Attendance Records
          </CardTitle>
           <CardDescription>
            Showing the last {recentEntries.length} attendance record(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentEntries.length > 0 ? (
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
                  {recentEntries.map((entry) => {
                    // laborName is now directly on the entry if populated correctly during add/fetch
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
            <p className="text-center text-muted-foreground py-8">No attendance records yet. Add one using the form above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
