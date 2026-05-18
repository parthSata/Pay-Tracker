import { createFileRoute } from "@tanstack/react-router";
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
import { Link } from "@tanstack/react-router";
import { useLoginForm } from "@/hooks/useLoginForm";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const { form, onSubmit, showResend, resending, handleResend } = useLoginForm();

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 flex items-center px-6 border-b gap-3">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg overflow-hidden border border-border bg-white">
            <img src="/PayTracker-Logo.png" alt="Logo" className="h-full w-full object-cover" />
          </div>
          <span className="font-bold text-primary text-xl tracking-tight">Pay Tracker</span>
        </Link>
      </header>
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Logging in..." : "Login"}
              </Button>

              {showResend && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-300">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full border-primary/30 text-primary hover:bg-primary/5"
                    onClick={handleResend}
                    disabled={resending}
                  >
                    {resending ? "Sending..." : "Resend Verification Link"}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Register
            </Link>
          </div>
          <div className="text-sm text-center text-muted-foreground border-t pt-4 mt-2">
            Are you an admin?{" "}
            <Link to="/admin/login" className="text-primary hover:underline font-medium">
              Admin Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  </div>
  );
}
