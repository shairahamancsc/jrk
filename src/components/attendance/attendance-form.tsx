
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { attendanceSchema, type AttendanceFormData } from '@/schemas/attendance-schema';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck, CalendarIcon, UserCheck, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function AttendanceForm() {
  const { laborProfiles, addAttendanceEntry } = useData();
  const { toast } = useToast();

  const form = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      laborId: '',
      date: new Date(),
      status: undefined, 
      workDetails: '',
    },
  });

  const onSubmit = (data: AttendanceFormData) => {
    addAttendanceEntry(data);
    const laborName = laborProfiles.find(lp => lp.id === data.laborId)?.name || 'Selected Labor';
    toast({
      title: "Attendance Recorded",
      description: `Attendance for ${laborName} on ${format(data.date, "PPP")} has been recorded.`,
    });
    form.reset({
      laborId: '',
      date: new Date(),
      status: undefined,
      workDetails: '',
    });
  };

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl text-primary font-headline">
          <CalendarCheck /> Record Daily Attendance
        </CardTitle>
        <CardDescription>Mark attendance and specify work details for labor.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="laborId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground flex items-center gap-1"><UserCheck size={16}/>Select Labor</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-1"
                      >
                        {laborProfiles.length > 0 ? (
                          <ScrollArea className="h-[150px] w-full rounded-md border p-3">
                            {laborProfiles.map(profile => (
                              <FormItem key={profile.id} className="flex items-center space-x-3 space-y-0 mb-2 last:mb-0">
                                <FormControl>
                                  <RadioGroupItem value={profile.id} id={`labor-${profile.id}`} />
                                </FormControl>
                                <FormLabel htmlFor={`labor-${profile.id}`} className="font-normal text-foreground cursor-pointer">
                                  {profile.name}
                                </FormLabel>
                              </FormItem>
                            ))}
                          </ScrollArea>
                        ) : (
                          <p className="text-sm text-muted-foreground pt-2">No labor profiles available. Please add profiles on the Labor Profiles page.</p>
                        )}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
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
                          onSelect={field.onChange}
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
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-foreground flex items-center gap-1"><ListChecks size={16}/>Attendance Status</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-4"
                    >
                      {(['present', 'absent', 'advance'] as const).map((statusValue) => (
                        <FormItem key={statusValue} className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={statusValue} />
                          </FormControl>
                          <FormLabel className="font-normal text-foreground capitalize">
                            {statusValue}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Work Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the work done or reason for absence/advance"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-base py-3 px-6">
              Record Attendance
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

