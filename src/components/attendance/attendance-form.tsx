
"use client";

import React, { useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { batchAttendanceSchema, type BatchAttendanceFormData } from '@/schemas/attendance-schema';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck, CalendarIcon, Users, FileText, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { LaborProfile } from '@/types';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';


export function AttendanceForm() {
  const { laborProfiles, addAttendanceEntry } = useData();
  const { toast } = useToast();

  const generateDefaultValues = useCallback((profiles: LaborProfile[], currentDate?: Date) => {
    return {
      date: currentDate || new Date(),
      workDetails: "", 
      attendances: profiles.map(profile => ({
        laborId: profile.id,
        laborName: profile.name,
        status: undefined,
        advanceAmount: undefined,
      })),
    };
  }, []);

  const form = useForm<BatchAttendanceFormData>({
    resolver: zodResolver(batchAttendanceSchema),
    defaultValues: generateDefaultValues(laborProfiles, new Date()),
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "attendances",
  });

  useEffect(() => {
    form.reset(generateDefaultValues(laborProfiles, form.getValues('date')));
  }, [laborProfiles, form.reset, generateDefaultValues, form]);

  const onSubmit = (data: BatchAttendanceFormData) => {
    let entriesRecordedCount = 0;
    const sharedWorkDetails = data.workDetails || ""; 

    data.attendances.forEach(att => {
      if (att.status || (att.advanceAmount !== undefined && att.advanceAmount > 0)) { 
        addAttendanceEntry({
          laborId: att.laborId,
          date: data.date,
          // Ensure status is provided if advance is given but no status is explicitly set
          // For now, schema requires status if any entry is to be made.
          // If advance can be given without status, this logic would need adjustment.
          status: att.status!, // Schema ensures status is present if this block is reached by refine
          workDetails: sharedWorkDetails,
          advanceAmount: att.advanceAmount,
        });
        entriesRecordedCount++;
      }
    });

    if (entriesRecordedCount > 0) {
      toast({
        title: "Attendance Recorded",
        description: `${entriesRecordedCount} attendance record(s) for ${format(data.date, "PPP")} have been processed.`,
      });
      form.reset(generateDefaultValues(laborProfiles, new Date())); 
    } else {
       toast({
        variant: "destructive",
        title: "No Attendance Marked or Advance Given",
        description: "Please select a status or enter an advance for at least one labor.",
      });
    }
  };

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl text-primary font-headline">
          <CalendarCheck /> Record Daily Attendance
        </CardTitle>
        <CardDescription>
          Select date, mark attendance, provide common work details, and enter advance amounts if applicable.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col max-w-xs">
                  <FormLabel className="text-foreground flex items-center gap-1"><CalendarIcon size={16}/>Attendance Date</FormLabel>
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
                        onSelect={(date) => {
                          field.onChange(date);
                          form.reset(generateDefaultValues(laborProfiles, date));
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {laborProfiles.length > 0 ? (
              <ScrollArea className="h-[400px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Labor Name</TableHead>
                      <TableHead className="w-[180px]">Status</TableHead>
                      <TableHead>Advance Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium py-3 align-top">
                           <FormLabel htmlFor={`attendances.${index}.status`} className="text-sm">
                            {item.laborName}
                          </FormLabel>
                        </TableCell>
                        <TableCell className="py-3 align-top">
                          <FormField
                            control={form.control}
                            name={`attendances.${index}.status`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="flex flex-col space-y-1 sm:flex-row sm:space-x-2 sm:space-y-0"
                                    id={`attendances.${index}.status`}
                                  >
                                    {(['present', 'absent'] as const).map((statusValue) => (
                                      <FormItem key={statusValue} className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                          <RadioGroupItem value={statusValue} />
                                        </FormControl>
                                        <FormLabel className="font-normal text-xs text-foreground capitalize">
                                          {statusValue}
                                        </FormLabel>
                                      </FormItem>
                                    ))}
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage className="text-xs"/>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="py-3 align-top">
                           <FormField
                              control={form.control}
                              name={`attendances.${index}.advanceAmount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="sr-only">Advance Amount for {item.laborName}</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                    <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input 
                                      type="number"
                                      placeholder="Enter amount" 
                                      {...field}
                                      onChange={event => field.onChange(event.target.value === '' ? undefined : +event.target.value)}
                                      className="pl-7 text-xs w-full max-w-[180px]" 
                                    />
                                    </div>
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border rounded-md text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground font-semibold">No Labor Profiles Found</p>
                <p className="text-sm text-muted-foreground">Please add labor profiles on the 'Labor Profiles' page before recording attendance.</p>
              </div>
            )}
            
            { laborProfiles.length > 0 && (
              <>
                <FormField
                  control={form.control}
                  name="workDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground flex items-center gap-1"><FileText size={16}/>Common Work Details (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter common work details for all marked labors..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-base py-3 px-6">
                Record All Marked Entries
                </Button>
              </>
            )}
             <FormMessage>{form.formState.errors.attendances?.root?.message || form.formState.errors.attendances?.message}</FormMessage>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
