
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/schemas/auth-schema';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Eye, EyeOff, Building2, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// TODO: If using hCaptcha, uncomment and install:
// import HCaptcha from '@hcaptcha/react-hcaptcha';

export default function LoginPage() {
  const { login, isLoading: authLoading } = useAuth();
  const { toast } = useToast(); 
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // TODO: Add state for CAPTCHA token
  // const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      captchaToken: undefined, // Initialize captchaToken
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    // TODO: Before calling login, ensure data.captchaToken is set if you're using CAPTCHA
    // if (!data.captchaToken) { // Or use the state `captchaToken`
    //   toast({
    //     variant: "destructive",
    //     title: "CAPTCHA Required",
    //     description: "Please complete the CAPTCHA.",
    //   });
    //   setIsSubmitting(false);
    //   return;
    // }

    try {
      await login(data); // Data now includes captchaToken (which will be undefined until widget is integrated)
    } catch (error: any) {
      form.setError("email", { type: "manual", message: " " }); 
      form.setError("password", { type: "manual", message: error.message || "Invalid credentials or CAPTCHA issue." });
      // TODO: Reset CAPTCHA if available, e.g., captchaRef.current?.resetCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Building2 size={32} />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">JRKE Attendance</CardTitle>
          <CardDescription className="text-muted-foreground">Admin Login Portal</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} className="text-base" type="email" autoComplete="email" />
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
                    <FormLabel className="text-foreground">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Enter your password" 
                          {...field}
                          className="text-base pr-10"
                          autoComplete="current-password"
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 
                TODO: Add your CAPTCHA component here. Example for hCaptcha:
                1. Install `@hcaptcha/react-hcaptcha`
                2. Import it: `import HCaptcha from '@hcaptcha/react-hcaptcha';`
                3. Get your hCaptcha site key from hcaptcha.com
                4. Add a ref: `const captchaRef = React.useRef<HCaptcha>(null);`
                5. Render the component:
                   <HCaptcha
                     sitekey="YOUR_HCAPTCHA_SITE_KEY"
                     onVerify={(token) => {
                       form.setValue('captchaToken', token); // Set token in form data
                       // OR setCaptchaToken(token); // If using separate state
                     }}
                     onExpire={() => {
                       form.setValue('captchaToken', undefined);
                       // OR setCaptchaToken(null);
                     }}
                     ref={captchaRef}
                   />
                Make sure to handle the case where form.setValue('captchaToken', ...) might trigger a re-render
                and clear other fields if not handled carefully with react-hook-form.
                You might need to manage the captchaToken in a separate React state and add it to `data` before calling `login(data)`.
              */}
              <FormField
                control={form.control}
                name="captchaToken"
                render={({ field }) => (
                  <FormItem className="hidden"> {/* Hidden for now, will be populated by actual CAPTCHA widget */}
                    <FormControl>
                      <Input type="hidden" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="text-xs text-muted-foreground p-2 border rounded-md">
                Note: CAPTCHA is enabled. Integration of a CAPTCHA widget (e.g., hCaptcha or Cloudflare Turnstile) 
                is required here to provide a token for successful login.
              </div>


              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-lg py-3 font-semibold"
                disabled={isSubmitting || authLoading}
              >
                {(isSubmitting || authLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Logging in..." : (authLoading ? "Authenticating..." : "Login")}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          <p>Manage your labor attendance efficiently.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
