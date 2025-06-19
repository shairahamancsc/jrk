
"use client";

import React, { useEffect, useState, useCallback } from 'react';
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
  existingProfile?: LaborProfile;
  mode?: 'add' | 'edit';
  onCancel?: () => void;
  onSubmitSuccess?: () => void; 
}

const LaborProfileFormComponent = ({ 
  existingProfile, 
  mode = 'add', 
  onCancel,
  onSubmitSuccess 
}: LaborProfileFormProps) => {
  const { addLaborProfile, updateLaborProfile } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const form = useForm<LaborProfileFormData>({
    resolver: zodResolver(laborProfileSchema),
    defaultValues: {
      name: existingProfile?.name || '',
      contact: existingProfile?.contact || '',
      aadhaarNumber: existingProfile?.aadhaar_number || '',
      panNumber: existingProfile?.pan_number || '',
      dailySalary: existingProfile?.daily_salary || undefined,
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
        photo: undefined, // Important: Do not reset file inputs if they are not part of the RHF's managed state here
        aadhaar: undefined,
        pan: undefined,
        drivingLicense: undefined,
      });
      setPhotoPreviewUrl(existingProfile.photo_url || null);
    } else if (mode === 'add') {
       form.reset({ 
        name: '',
        contact: '',
        aadhaarNumber: '',
        panNumber: '',
        dailySalary: undefined,
        photo: undefined,
        aadhaar: undefined,
        pan: undefined,
        drivingLicense: undefined,
      });
      setPhotoPreviewUrl(null);
    }
  }, [existingProfile?.id, mode, form.reset]);


  const onSubmit = async (data: LaborProfileFormData) => {
    setIsSubmitting(true);
    const profileDataForContext: LaborProfileFormDataWithFiles = {
      name: data.name,
      contact: data.contact,
      aadhaarNumber: data.aadhaarNumber,
      panNumber: data.panNumber ? data.panNumber.toUpperCase() : undefined,
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
      }
      
      if (mode === 'add') { 
        form.reset();
        setPhotoPreviewUrl(null); 
      }
      onSubmitSuccess?.(); 
    } catch (error) {
      console.error("Submission error in form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const GenericFileInput = ({ fieldName, label, currentFileUrl }: { fieldName: keyof LaborProfileFormData; label: string, currentFileUrl?: string }) => (
    <FormItem>
      <FormLabel className="flex items-center gap-2 text-foreground">
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
      <FormMessage />
    </FormItem>
  );

  const cardTitleText = mode === 'edit' ? "Edit Labor Profile" : "Add New Labor Profile";
  const cardDescriptionText = mode === 'edit' 
    ? `Update details for ${existingProfile?.name || 'the labor'}.`
    : "Enter the details of the new labor. Stored securely on server.";
  const submitButtonText = mode === 'edit' ? "Save Changes" : "Add Labor Profile";
  const submittingButtonText = mode === 'edit' ? "Saving..." : "Adding...";

  const FormWrapper = ({ children }: { children: React.ReactNode }) => 
    mode === 'edit' ? <>{children}</> : (
      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-primary font-headline">
            <UserPlus /> {cardTitleText}
          </CardTitle>
          <CardDescription>{cardDescriptionText}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    );


  return (
    <FormWrapper>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 sm:space-y-3 md:space-y-4">
          
          <FormField
            control={form.control}
            name="photo"
            render={({ field }) => (
              <FormItem className="flex flex-col items-center space-y-2">
                <Avatar className="h-12 w-12 sm:h-16 md:h-20 border-2 border-muted-foreground/50">
                  <AvatarImage src={photoPreviewUrl || existingProfile?.photo_url || ''} alt="Profile Photo Preview" data-ai-hint="profile person" />
                  <AvatarFallback>
                    <UserCircle2 className="h-8 w-8 sm:h-10 md:h-12 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <FormControl>
                  <div>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        form.setValue('photo', e.target.files, { shouldValidate: true }); 
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPhotoPreviewUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        } else {
                          setPhotoPreviewUrl(existingProfile?.photo_url || null); 
                        }
                      }}
                      ref={field.ref} 
                      name={field.name} // Ensure name is passed for RHF
                      onBlur={field.onBlur} // Ensure onBlur is passed for RHF
                      disabled={isSubmitting}
                    />
                    <FormLabel
                      htmlFor="photo-upload"
                      className="cursor-pointer inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-primary hover:text-primary/80"
                    >
                      <FilePlus2 size={16} />
                      Upload Photo
                    </FormLabel>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 sm:gap-2 md:gap-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground text-xs sm:text-sm">Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} disabled={isSubmitting} className="text-xs sm:text-sm"/>
                  </FormControl>
                  <FormMessage className="text-xs"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground text-xs sm:text-sm">Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact number" {...field} disabled={isSubmitting} className="text-xs sm:text-sm"/>
                  </FormControl>
                  <FormMessage className="text-xs"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aadhaarNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1 text-foreground text-xs sm:text-sm">
                    <Fingerprint size={14}/> Aadhaar Number (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter 12-digit Aadhaar number" {...field} disabled={isSubmitting} maxLength={12} className="text-xs sm:text-sm"/>
                  </FormControl>
                  <FormMessage className="text-xs"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="panNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1 text-foreground text-xs sm:text-sm">
                   <ScanLine size={14}/> PAN Number (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter PAN number (e.g., ABCDE1234F)" 
                      {...field} 
                      disabled={isSubmitting} 
                      maxLength={10}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      className="text-xs sm:text-sm"
                    />
                  </FormControl>
                  <FormMessage className="text-xs"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dailySalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1 text-foreground text-xs sm:text-sm">
                    <WalletCards size={14} /> Daily Salary (₹) (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="Enter daily salary amount" 
                      {...field} 
                      value={field.value === undefined ? '' : String(field.value)}
                      onChange={event => {
                        const value = event.target.value;
                        field.onChange(value === '' ? undefined : parseFloat(value));
                      }}
                      disabled={isSubmitting} 
                      step="0.01"
                      min="0"
                      className="text-xs sm:text-sm"
                    />
                  </FormControl>
                  <FormMessage className="text-xs"/>
                </FormItem>
              )}
            />
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-primary pt-3 border-t mt-4">Upload Documents (Optional)</h3>
          <p className="text-xs sm:text-sm text-muted-foreground -mt-3 mb-3">These are for document copies (images/PDFs). The numbers are entered above.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 sm:gap-2 md:gap-3">
            <GenericFileInput fieldName="aadhaar" label="Aadhaar Card Document" currentFileUrl={existingProfile?.aadhaar_url} />
            <GenericFileInput fieldName="pan" label="PAN Card Document" currentFileUrl={existingProfile?.pan_url}/>
            <GenericFileInput fieldName="drivingLicense" label="Driving License Document" currentFileUrl={existingProfile?.driving_license_url} />
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 pt-3">
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 text-sm sm:text-base py-2.5 px-4 sm:py-3 sm:px-6 w-full md:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? submittingButtonText : submitButtonText}
            </Button>
            {mode === 'edit' && onCancel && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setPhotoPreviewUrl(existingProfile?.photo_url || null); 
                  onCancel();
                }}
                className="text-sm sm:text-base py-2.5 px-4 sm:py-3 sm:px-6 w-full md:w-auto"
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

export const LaborProfileForm = React.memo(LaborProfileFormComponent);
