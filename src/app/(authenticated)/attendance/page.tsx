
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { AttendanceForm } from '@/components/attendance/attendance-form';
import { useData } from '@/contexts/data-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AttendanceEntry } from '@/types';
import { format } from 'date-fns';
import { ListOrdered, Loader2 } from 'lucide-react';

export default function AttendancePage() {
  const { attendanceEntries, laborProfiles, isLoading: dataLoading } = useData();
  const [clientLoading, setClientLoading] = useState(true);

  useEffect(() => {
    if (!dataLoading) {
      setClientLoading(false);
    }
  }, [dataLoading]);

  const recentEntries = useMemo(() => {
    return [...attendanceEntries]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10); 
  }, [attendanceEntries]);

  const getStatusColor = (status: AttendanceEntry['status']) => {
    switch (status) {
      case 'present': return 'bg-green-500 hover:bg-green-600';
      case 'absent': return 'bg-red-500 hover:bg-red-600';
      case 'advance': return 'bg-yellow-500 hover:bg-yellow-600 text-black';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getWorkDetailsDisplay = (entry: AttendanceEntry) => {
    if (entry.status === 'advance') {
      return `Advance: ${entry.advanceDetails || 'Details N/A'}`;
    }
    return entry.workDetails || 'N/A';
  };


  if (clientLoading) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14)-2*theme(spacing.4))] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline font-bold text-primary">Daily Attendance Entry</h1>
      
      <AttendanceForm />

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
                    <TableHead>Details</TableHead>
                    <TableHead>Recorded At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEntries.map((entry) => {
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
                        <TableCell className="max-w-xs truncate">{getWorkDetailsDisplay(entry)}</TableCell>
                        <TableCell>{format(new Date(entry.createdAt), "Pp")}</TableCell>
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
