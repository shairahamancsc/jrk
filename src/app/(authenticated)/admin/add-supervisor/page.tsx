
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supervisorCreationSchema, type SupervisorCreationFormData } from '@/schemas/auth-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Eye, EyeOff, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase/client'; // Ensure Supabase client is imported

export default function AddSupervisorPage() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SupervisorCreationFormData>({
    resolver: zodResolver(supervisorCreationSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleCreateSupervisor = async (formData: SupervisorCreationFormData) => {
    setIsSubmitting(true);
    console.log("Attempting to create supervisor via Edge Function:", formData.email);

    try {
      const { data: funcData, error: funcError } = await supabase.functions.invoke('create-supervisor', {
        body: { email: formData.email, password: formData.password },
      });

      if (funcError) {
        console.error('Error creating supervisor via Edge Function:', funcError);
        toast({
          variant: "destructive",
          title: "Failed to Create Supervisor",
          description: funcError.message || "Could not create supervisor account. Check Edge Function logs.",
        });
      } else {
        console.log('Supervisor creation initiated successfully:', funcData);
        toast({
          title: "Supervisor Account Created",
          description: `Supervisor account for ${formData.email} has been successfully created.`,
        });
        form.reset();
      }
    } catch (e: any) {
      // Catch any unexpected errors during the invoke call itself
      console.error('Unexpected error invoking Edge Function:', e);
      toast({
        variant: "destructive",
        title: "Invocation Error",
        description: e.message || "An unexpected error occurred while trying to create the supervisor.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <UserPlus size={32} /> Add New Supervisor
        </h1>
        <p className="text-muted-foreground">
          Create a new user account with supervisor privileges.
        </p>
      </header>

      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle>Supervisor Account Details</CardTitle>
          <CardDescription>
            The new supervisor will be created with the role 'supervisor'.
            They will be able to log in with these credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateSupervisor)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Supervisor Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter supervisor's email" {...field} type="email" disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Initial Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Enter initial password" 
                          {...field}
                          className="pr-10"
                          disabled={isSubmitting}
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          disabled={isSubmitting}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-lg py-3 font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Creating Account..." : "Create Supervisor Account"}
              </Button>
               <div className="text-xs text-muted-foreground p-2 border rounded-md bg-background">
                <strong>Note:</strong> This form invokes a secure Supabase Edge Function to create the supervisor account.
                The password entered here should be temporary; the supervisor should be advised to change it upon first login if your Edge Function doesn't automatically send an invitation/reset link.
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
