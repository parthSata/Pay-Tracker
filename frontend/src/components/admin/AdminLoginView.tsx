import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { AdminLoginFormValues } from "@/hooks/useAdminLogin";

interface AdminLoginViewProps {
  form: UseFormReturn<AdminLoginFormValues>;
  onSubmit: (data: AdminLoginFormValues) => Promise<void>;
  navigate: (options: { to: string }) => Promise<void>;
}

export function AdminLoginView({ form, onSubmit, navigate }: AdminLoginViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header variant="auth" />
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md border-destructive/20 shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-destructive/10 rounded-full">
                <ShieldAlert className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Admin Portal</CardTitle>
            <CardDescription className="text-center">
              Restricted area. Please authenticate to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="adminEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Email</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@paytracker.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="adminCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Secure Code</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" variant="destructive" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Verifying..." : "Access Admin Panel"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-muted-foreground"
              onClick={() => navigate({ to: "/login" })}
            >
              Back to User Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
