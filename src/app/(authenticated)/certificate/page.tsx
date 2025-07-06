
"use client";

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { certificateSchema, type CertificateFormData } from '@/schemas/certificate-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { FileSignature, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function CertificatePage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CertificateFormData>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      title: 'Mr.',
      name: '',
      address: '',
      state: '',
      district: '',
      areaPin: '',
      mainSwitchAmps: '',
      equipments: [{ capacity: '', quantity: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "equipments",
  });

  const onSubmit = async (data: CertificateFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate certificate.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // The response was not JSON. It might be a server error page (HTML) or plain text.
          const textError = await response.text();
          // We don't want to display a whole HTML page in the toast, so we give a generic message.
          errorMessage = 'An unexpected server error occurred. Please check the function logs.';
          console.error("Server returned non-JSON error response:", textError);
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Completion_Certificate.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Certificate Generated",
        description: "Your PDF has been successfully created and downloaded.",
      });
      form.reset();

    } catch (error: any) {
      console.error("Certificate generation error:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <FileSignature size={32} /> Certificate Generation
        </h1>
        <p className="text-muted-foreground">
          Fill out the form below to generate a new Completion Certificate.
        </p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Consumer Details</CardTitle>
              <CardDescription>Enter the details of the consumer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Mr., Mrs." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter consumer's full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter consumer's full address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter state" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter district" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="areaPin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area PIN Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter PIN code" {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Equipment &amp; Load Details</CardTitle>
              <CardDescription>Specify the equipment installed and the main switch details.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="max-w-xs">
                 <FormField
                    control={form.control}
                    name="mainSwitchAmps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Switch Capacity (Amps)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 63" {...field} type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>

              <Separator className="my-6" />

              <h3 className="text-lg font-medium mb-2">Equipment List</h3>
              <div className="border rounded-md">
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Capacity (Watts)</TableHead>
                      <TableHead>No. of Points</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                       <TableRow key={field.id}>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`equipments.${index}.capacity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" placeholder="e.g., 100" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                         <TableCell>
                          <FormField
                            control={form.control}
                            name={`equipments.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" placeholder="e.g., 5" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                           {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => remove(index)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => append({ capacity: '', quantity: '' })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Equipment
              </Button>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Generating PDF...' : 'Generate and Download Certificate'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
