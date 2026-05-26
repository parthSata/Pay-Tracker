import { Link } from "@tanstack/react-router";
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
import { Label } from "@/components/ui/label";

interface LoginFormProps {
  form: any;
  onSubmit: (data: any) => void;
  showResend: boolean;
  resending: boolean;
  handleResend: () => void;
  requires2FA?: boolean;
  otpToken?: string;
  setOtpToken?: (val: string) => void;
  onVerify2FA?: (e: React.FormEvent) => void;
}

export function LoginForm({ form, onSubmit, showResend, resending, handleResend, requires2FA, otpToken, setOtpToken, onVerify2FA }: LoginFormProps) {
  if (requires2FA) {
    return (
      <Card className="w-full max-w-md shadow-lg animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Two-Factor Authentication</CardTitle>
          <CardDescription className="text-center">
            Open your authenticator app and enter the 6-digit code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onVerify2FA} className="space-y-4">
            <div className="space-y-2">
              <Label>Authenticator Code</Label>
              <Input
                autoFocus
                placeholder="123456"
                maxLength={6}
                value={otpToken}
                onChange={(e) => setOtpToken?.(e.target.value.replace(/[^0-9]/g, ''))}
                className="text-center tracking-widest text-lg font-mono"
              />
            </div>
            <Button type="submit" className="w-full">
              Verify
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
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
      </CardFooter>
    </Card>
  );
}
