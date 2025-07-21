
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { laborProfileSchema, type LaborProfileFormData } from '@/schemas/labor-schema';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, FileText, Loader2, Fingerprint, ScanLine, UserCircle2, FilePlus2, WalletCards } from 'lucide-react';
import type { LaborProfile, LaborProfileFormDataWithFiles } from '@/types'; 

interface LaborProfileFormProps {
  existingProfile?: LaborProfile | null;
  mode: 'add' | 'edit';
  onCancel?: () => void;
  onSubmitSuccess?: () => void; 
}

const LaborProfileFormComponent = ({ 
  existingProfile, 
  mode, 
  onCancel,
  onSubmitSuccess 
}: LaborProfileFormProps) => {
  const { addLaborProfile, updateLaborProfile } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const form = useForm<LaborProfileFormData>({
    resolver: zodResolver(laborProfileSchema),
    defaultValues: {
      name: '',
      contact: '',
      aadhaarNumber: '',
      panNumber: '',
      dailySalary: undefined,
      photo: undefined,
      aadhaar: undefined,
      pan: undefined,
      drivingLicense: undefined,
    },
  });

  useEffect(() => {
    if (mode === 'edit' && existingProfile) {
      form.reset({
        name: existingProfile.name,
        contact: existingProfile.contact,
        aadhaarNumber: existingProfile.aadhaar_number || '',
        panNumber: existingProfile.pan_number || '',
        dailySalary: existingProfile.daily_salary || undefined,
        photo: undefined,
        aadhaar: undefined,
        pan: undefined,
        drivingLicense: undefined,
      });
      setPhotoPreviewUrl(existingProfile.photo_url || null);
    } else {
       form.reset();
       setPhotoPreviewUrl(null);
    }
  }, [existingProfile, mode, form]);

  const onSubmit = async (data: LaborProfileFormData) => {
    setIsSubmitting(true);
    
    const profileDataForContext: LaborProfileFormDataWithFiles = {
      name: data.name,
      contact: data.contact,
      aadhaarNumber: data.aadhaarNumber,
      panNumber: data.panNumber,
      dailySalary: data.dailySalary,
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
        form.reset();
        setPhotoPreviewUrl(null);
      }
      onSubmitSuccess?.();
    } catch (error) {
      console.error("Form submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const GenericFileInput = ({ fieldName, label, currentFileUrl }: { fieldName: keyof LaborProfileFormData; label: string, currentFileUrl?: string }) => (
    <FormItem>
      <FormLabel className="flex items-center gap-2 text-foreground text-xs sm:text-sm">
        <FileText size={16} /> {label}
      </FormLabel>
      {mode === 'edit' && currentFileUrl && (
        <div className="text-xs text-muted-foreground mb-1">
          Current: <a href={currentFileUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{decodeURIComponent(currentFileUrl.substring(currentFileUrl.lastIndexOf('/') + 1).split('?')[0].substring(currentFileUrl.substring(currentFileUrl.lastIndexOf('/') + 1).split('?')[0].indexOf('_', currentFileUrl.substring(currentFileUrl.lastIndexOf('/') + 1).split('?')[0].indexOf('_') + 1) + 1))}</a>
          <p className="text-xs">(To change, select a new file below.)</p>
        </div>
      )}
      <FormControl>
        <Input 
          type="file" 
          accept="image/*,application/pdf"
          className="file:text-primary file:font-semibold file:mr-2 file:border-0 file:bg-accent file:text-accent-foreground file:rounded-md file:px-2 file:py-1 hover:file:bg-accent/80 text-xs"
          {...form.register(fieldName)} 
          disabled={isSubmitting}
        />
      </FormControl>
      <FormMessage className="text-xs" />
    </FormItem>
  );

  const cardTitleText = mode === 'edit' ? "Edit Labor Profile" : "Add New Labor Profile";
  const cardDescriptionText = mode === 'edit' 
    ? `Update details for ${existingProfile?.name || 'the labor'}.`
    : "Enter the details of the new labor. Stored securely on server.";
  const submitButtonText = mode === 'edit' ? "Save Changes" : "Add Labor Profile";
  const submittingButtonText = mode === 'edit' ? "Saving..." : "Adding...";

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField
          control={form.control}
          name="photo"
          render={() => (
            <FormItem className="flex flex-col items-center space-y-2">
              <Avatar className="h-20 w-20 border-2 border-muted-foreground/50">
                <AvatarImage src={photoPreviewUrl || ''} alt="Profile Photo Preview" data-ai-hint="profile person" />
                <AvatarFallback>
                  <UserCircle2 className="h-12 w-12 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <FormControl>
                <div>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    {...form.register("photo")}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      form.setValue('photo', file, { shouldValidate: true }); 
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setPhotoPreviewUrl(reader.result as string);
                        reader.readAsDataURL(file);
                      } else {
                        setPhotoPreviewUrl(existingProfile?.photo_url || null);
                      }
                    }}
                    disabled={isSubmitting}
                  />
                  <FormLabel
                    htmlFor="photo-upload"
                    className="cursor-pointer inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                  >
                    <FilePlus2 size={16} />
                    {photoPreviewUrl ? 'Change Photo' : 'Upload Photo'}
                  </FormLabel>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <FormLabel className="flex items-center gap-1 text-foreground">
                  <Fingerprint size={14}/> Aadhaar Number (Optional)
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
                <FormLabel className="flex items-center gap-1 text-foreground">
                 <ScanLine size={14}/> PAN Number (Optional)
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter PAN number" 
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
          <FormField
            control={form.control}
            name="dailySalary"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1 text-foreground">
                  <WalletCards size={14} /> Daily Salary (₹) (Optional)
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="Enter daily salary" 
                    {...field} 
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.valueAsNumber || undefined)}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <h3 className="text-lg font-semibold text-primary pt-3 border-t mt-4">Upload Documents (Optional)</h3>
        <p className="text-sm text-muted-foreground -mt-3 mb-3">These are for document copies (images/PDFs).</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <GenericFileInput fieldName="aadhaar" label="Aadhaar Card Document" currentFileUrl={existingProfile?.aadhaar_url} />
          <GenericFileInput fieldName="pan" label="PAN Card Document" currentFileUrl={existingProfile?.pan_url}/>
          <GenericFileInput fieldName="drivingLicense" label="Driving License Document" currentFileUrl={existingProfile?.driving_license_url} />
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 pt-3">
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary/90"
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );

  if (mode === 'add') {
    return (
       <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-primary font-headline">
            <UserPlus /> {cardTitleText}
          </CardTitle>
          <CardDescription>{cardDescriptionText}</CardDescription>
        </CardHeader>
        <CardContent>{formContent}</CardContent>
      </Card>
    );
  }
  
  return formContent;
}

export const LaborProfileForm = React.memo(LaborProfileFormComponent);

    