
"use client";

import React, { useEffect, useState } from 'react'; // Added React and useEffect
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { laborProfileSchema, type LaborProfileFormData } from '@/schemas/labor-schema';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UserPlus, FileText, Loader2, Fingerprint, ScanLine } from 'lucide-react';
import type { LaborProfile, LaborProfileFormDataWithFiles } from '@/types'; 
// import { useToast } from "@/hooks/use-toast"; // Toast is handled by DataContext

interface LaborProfileFormProps {
  existingProfile?: LaborProfile;
  mode?: 'add' | 'edit';
  onCancel?: () => void;
  onSubmitSuccess?: () => void; // Callback for successful submission
}

export function LaborProfileForm({ 
  existingProfile, 
  mode = 'add', 
  onCancel,
  onSubmitSuccess 
}: LaborProfileFormProps) {
  const { addLaborProfile, updateLaborProfile } = useData();
  // const { toast } = useToast(); // Local toast might not be needed if DataContext handles it
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LaborProfileFormData>({
    resolver: zodResolver(laborProfileSchema),
    defaultValues: {
      name: existingProfile?.name || '',
      contact: existingProfile?.contact || '',
      aadhaarNumber: existingProfile?.aadhaar_number || '',
      panNumber: existingProfile?.pan_number || '',
      photo: undefined, // File inputs are always undefined initially unless handled differently for edit
      aadhaar: undefined,
      pan: undefined,
      drivingLicense: undefined,
    },
  });

  useEffect(() => {
    if (existingProfile && mode === 'edit') {
      form.reset({
        name: existingProfile.name,
        contact: existingProfile.contact,
        aadhaarNumber: existingProfile.aadhaar_number || '',
        panNumber: existingProfile.pan_number || '',
        // Note: File inputs cannot be programmatically pre-filled with existing files for security reasons.
        // Users must re-select files if they wish to change them.
        // URLs like existingProfile.photo_url can be displayed separately as "current photo".
        photo: undefined,
        aadhaar: undefined,
        pan: undefined,
        drivingLicense: undefined,
      });
    } else if (mode === 'add') {
       form.reset({ // Reset to initial empty values for 'add' mode
        name: '',
        contact: '',
        aadhaarNumber: '',
        panNumber: '',
        photo: undefined,
        aadhaar: undefined,
        pan: undefined,
        drivingLicense: undefined,
      });
    }
  }, [existingProfile, mode, form]);


  const onSubmit = async (data: LaborProfileFormData) => {
    setIsSubmitting(true);
    const profileDataForContext: LaborProfileFormDataWithFiles = {
      name: data.name,
      contact: data.contact,
      aadhaarNumber: data.aadhaarNumber,
      panNumber: data.panNumber ? data.panNumber.toUpperCase() : undefined,
      photo: data.photo, 
      aadhaar: data.aadhaar,
      pan: data.pan,
      drivingLicense: data.drivingLicense,
    };

    try {
      if (mode === 'edit' && existingProfile) {
        await updateLaborProfile(existingProfile.id, profileDataForContext);
      } else {
        await addLaborProfile(profileDataForContext); 
      }
      
      if (mode === 'add') { // Only reset form for add mode
        form.reset();
      }
      onSubmitSuccess?.(); // Call success callback e.g. to close modal
    } catch (error) {
      console.error("Submission error in form:", error);
      // Error toast should be handled by context methods (addLaborProfile/updateLaborProfile)
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const FileInput = ({ field, label, currentFileUrl }: { field: any; label: string, currentFileUrl?: string }) => (
    <FormItem>
      <FormLabel className="flex items-center gap-2 text-foreground">
        <FileText size={16} /> {label}
      </FormLabel>
      {mode === 'edit' && currentFileUrl && (
        <div className="text-xs text-muted-foreground mb-1">
          Current: <a href={currentFileUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{currentFileUrl.substring(currentFileUrl.lastIndexOf('/') + 1)}</a>
          <p className="text-xs">(To change, select a new file below. To remove, ensure no new file is selected and this will be handled by update logic - TBD).</p>
        </div>
      )}
      <FormControl>
        <Input 
          type="file" 
          accept="image/*,application/pdf"
          className="file:text-primary file:font-semibold file:mr-2 file:border-0 file:bg-accent file:text-accent-foreground file:rounded-md file:px-2 file:py-1 hover:file:bg-accent/80"
          {...form.register(field.name)} 
          disabled={isSubmitting}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  // Determine card title based on mode
  const cardTitle = mode === 'edit' ? "Edit Labor Profile" : "Add New Labor Profile";
  const cardDescription = mode === 'edit' 
    ? `Update details for ${existingProfile?.name || 'the labor'}.`
    : "Enter the details of the new labor. Stored securely on server.";
  const submitButtonText = mode === 'edit' ? "Save Changes" : "Add Labor Profile";
  const submittingButtonText = mode === 'edit' ? "Saving..." : "Adding...";

  // If form is part of a modal (edit mode) and onCancel is provided, don't render a Card wrapper
  const FormWrapper = ({ children }: { children: React.ReactNode }) => 
    mode === 'edit' ? <>{children}</> : (
      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-primary font-headline">
            <UserPlus /> {cardTitle}
          </CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    );


  return (
    <FormWrapper>
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
            <FormField
              control={form.control}
              name="aadhaarNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-foreground">
                    <Fingerprint size={16}/> Aadhaar Number (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter 12-digit Aadhaar number" {...field} disabled={isSubmitting} maxLength={12}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="panNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-foreground">
                   <ScanLine size={16}/> PAN Number (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter PAN number (e.g., ABCDE1234F)" 
                      {...field} 
                      disabled={isSubmitting} 
                      maxLength={10}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <h3 className="text-lg font-semibold text-primary pt-4 border-t mt-6">Upload Documents (Optional)</h3>
          <p className="text-sm text-muted-foreground -mt-4 mb-4">These are for document copies (images/PDFs). The numbers are entered above.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => <FileInput field={field} label="Profile Photo" currentFileUrl={existingProfile?.photo_url}/>}
            />
            <FormField
              control={form.control}
              name="aadhaar" 
              render={({ field }) => <FileInput field={field} label="Aadhaar Card Document" currentFileUrl={existingProfile?.aadhaar_url} />}
            />
            <FormField
              control={form.control}
              name="pan"
              render={({ field }) => <FileInput field={field} label="PAN Card Document" currentFileUrl={existingProfile?.pan_url}/>}
            />
            <FormField
              control={form.control}
              name="drivingLicense"
              render={({ field }) => <FileInput field={field} label="Driving License Document" currentFileUrl={existingProfile?.driving_license_url} />}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 text-base py-3 px-6 flex-grow md:flex-grow-0"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? submittingButtonText : submitButtonText}
            </Button>
            {mode === 'edit' && onCancel && (
              <Button 
                type="button" 
                variant="outline"
                onClick={onCancel}
                className="text-base py-3 px-6"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </FormWrapper>
  );
}
