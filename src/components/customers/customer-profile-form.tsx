
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerProfileSchema, type CustomerProfileFormData } from '@/schemas/customer-schema';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Loader2 } from 'lucide-react';
import type { CustomerProfile } from '@/types'; 

interface CustomerProfileFormProps {
  existingProfile?: CustomerProfile;
  mode?: 'add' | 'edit';
  onCancel?: () => void;
  onSubmitSuccess?: () => void; 
}

const categoryOptions = ['Industrial', 'Commercial', 'Residential'];
const ownershipOptions = ['Private', 'Public', 'Partnership'];

const CustomerProfileFormComponent = ({ 
  existingProfile, 
  mode = 'add', 
  onCancel,
  onSubmitSuccess 
}: CustomerProfileFormProps) => {
  const { addCustomerProfile, updateCustomerProfile } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CustomerProfileFormData>({
    resolver: zodResolver(customerProfileSchema),
    defaultValues: {
      customer_id: existingProfile?.customer_id || '',
      name: existingProfile?.name || '',
      mobile_no: existingProfile?.mobile_no || '',
      address: existingProfile?.address || '',
      category: existingProfile?.category || '',
      ownership_type: existingProfile?.ownership_type || '',
      load_in_tons: existingProfile?.load_in_tons || undefined,
      payment_rate_per_load: existingProfile?.payment_rate_per_load || undefined,
    },
  });

  useEffect(() => {
    if (mode === 'edit' && existingProfile) {
      form.reset(existingProfile);
    } else if (mode === 'add') {
       form.reset({
        customer_id: '',
        name: '',
        mobile_no: '',
        address: '',
        category: '',
        ownership_type: '',
        load_in_tons: undefined,
        payment_rate_per_load: undefined,
      });
    }
  }, [existingProfile, mode, form.reset]);


  const onSubmit = async (data: CustomerProfileFormData) => {
    setIsSubmitting(true);
    try {
      if (mode === 'edit' && existingProfile) {
        await updateCustomerProfile(existingProfile.id, data);
      } else {
        await addCustomerProfile(data); 
      }
      
      if (mode === 'add') { 
        form.reset();
      }
      onSubmitSuccess?.(); 
    } catch (error) {
      console.error("Submission error in form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const cardTitleText = mode === 'edit' ? "Edit Customer Profile" : "Add New Customer Profile";
  const cardDescriptionText = mode === 'edit' 
    ? `Update details for ${existingProfile?.name || 'the customer'}.`
    : "Enter the details of the new customer.";
  const submitButtonText = mode === 'edit' ? "Save Changes" : "Add Customer Profile";
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter unique customer ID" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter customer's name" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobile_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile No</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter mobile number" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter full address" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryOptions.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ownership_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ownership Type</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ownership type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ownershipOptions.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="load_in_tons"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Load (in Tons)</FormLabel>
                  <FormControl>
                     <Input 
                      type="number"
                      placeholder="Enter load capacity" 
                      {...field} 
                      onChange={event => field.onChange(event.target.valueAsNumber)}
                      disabled={isSubmitting} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="payment_rate_per_load"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Rate Per Load (₹)</FormLabel>
                  <FormControl>
                     <Input 
                      type="number"
                      placeholder="Enter rate per load" 
                      {...field} 
                      onChange={event => field.onChange(event.target.valueAsNumber)}
                      disabled={isSubmitting} 
                      step="0.01"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
    </FormWrapper>
  );
}

export const CustomerProfileForm = React.memo(CustomerProfileFormComponent);
