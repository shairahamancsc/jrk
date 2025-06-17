
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
// import { supabase } from '@/lib/supabase/client'; // For actual implementation with Edge Function

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

  const handleCreateSupervisor = async (data: SupervisorCreationFormData) => {
    setIsSubmitting(true);
    console.log("Attempting to create supervisor:", data.email);

    // -------------------------------------------------------------------------
    // TODO: SECURE SUPERVISOR CREATION LOGIC
    // The following is a placeholder. In a real application, you MUST NOT
    // call Supabase admin functions directly from the client-side.
    //
    // 1. Create a Supabase Edge Function (e.g., 'create-supervisor').
    // 2. This Edge Function should:
    //    - Be callable only by authenticated admin users (check requestor's role).
    //    - Use the `supabase.auth.admin.createUser()` method with the service_role key.
    //    - Include `user_metadata: { role: 'supervisor' }` in the createUser options.
    //    - Optionally, send a password reset or invitation email.
    // 3. From here, invoke that Edge Function:
    //    const { data: funcData, error: funcError } = await supabase.functions.invoke('create-supervisor', {
    //      body: { email: data.email, password: data.password }, // Or just email if sending invite
    //    });
    //    if (funcError) { /* handle error */ } else { /* handle success */ }
    // -------------------------------------------------------------------------

    // Simulating an API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Placeholder success handling
    toast({
      title: "Supervisor Account Submitted (Simulated)",
      description: `Request to create supervisor with email ${data.email} has been processed. (This is a simulation - backend integration needed.)`,
    });
    form.reset();
    
    // Placeholder error handling (example)
    // toast({
    //   variant: "destructive",
    //   title: "Failed to Create Supervisor (Simulated)",
    //   description: "Could not create supervisor account. Check backend function.",
    // });

    setIsSubmitting(false);
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
            The new supervisor will be able to log in with these credentials.
            An email will NOT be sent automatically by this form (backend required).
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
                {isSubmitting ? "Submitting..." : "Create Supervisor Account"}
              </Button>
               <div className="text-xs text-muted-foreground p-2 border rounded-md bg-background">
                <strong>Important:</strong> This form simulates supervisor creation.
                Actual user creation and role assignment require secure backend integration (e.g., a Supabase Edge Function).
                The password entered here should be temporary; the supervisor should change it upon first login.
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
