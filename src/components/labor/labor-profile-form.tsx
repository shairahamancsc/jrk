
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { laborProfileSchema, type LaborProfileFormData } from '@/schemas/labor-schema'; // FormData still uses File type for input
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { UserPlus, FileText, Loader2 } from 'lucide-react';
import type { LaborProfileFormDataWithFiles } from '@/types'; // For passing to context
import { useState } from 'react';

export function LaborProfileForm() {
  const { addLaborProfile } = useData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LaborProfileFormData>({
    resolver: zodResolver(laborProfileSchema),
    defaultValues: {
      name: '',
      contact: '',
      photo: undefined,
      aadhaar: undefined,
      pan: undefined,
      drivingLicense: undefined,
    },
  });

  const onSubmit = async (data: LaborProfileFormData) => {
    setIsSubmitting(true);
    const profileDataForContext: LaborProfileFormDataWithFiles = {
      name: data.name,
      contact: data.contact,
      // Zod schema ensures these are File | undefined after transformation
      photo: data.photo, 
      aadhaar: data.aadhaar,
      pan: data.pan,
      drivingLicense: data.drivingLicense,
    };

    try {
      await addLaborProfile(profileDataForContext); 
      // Toast is handled by DataProvider now
      form.reset();
    } catch (error) {
      // Error toast is handled by DataProvider
      console.error("Submission error in form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const FileInput = ({ field, label }: { field: any; label: string }) => (
    <FormItem>
      <FormLabel className="flex items-center gap-2 text-foreground">
        <FileText size={16} /> {label}
      </FormLabel>
      <FormControl>
        <Input 
          type="file" 
          accept="image/*,application/pdf"
          className="file:text-primary file:font-semibold file:mr-2 file:border-0 file:bg-accent file:text-accent-foreground file:rounded-md file:px-2 file:py-1 hover:file:bg-accent/80"
          {...form.register(field.name)} 
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl text-primary font-headline">
          <UserPlus /> Add New Labor Profile
        </CardTitle>
        <CardDescription>Enter the details of the new labor. Stored securely on server.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact number" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <h3 className="text-lg font-semibold text-primary pt-4 border-t mt-6">Upload Documents (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => <FileInput field={field} label="Profile Photo" />}
              />
              <FormField
                control={form.control}
                name="aadhaar"
                render={({ field }) => <FileInput field={field} label="Aadhaar Card" />}
              />
              <FormField
                control={form.control}
                name="pan"
                render={({ field }) => <FileInput field={field} label="PAN Card" />}
              />
              <FormField
                control={form.control}
                name="drivingLicense"
                render={({ field }) => <FileInput field={field} label="Driving License" />}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-base py-3 px-6"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Adding..." : "Add Labor Profile"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
