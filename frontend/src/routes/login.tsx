import { createFileRoute, Link } from "@tanstack/react-router";
import { useLoginForm } from "@/hooks/useLoginForm";
import { LoginForm } from "@/components/auth/LoginForm";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const { form, onSubmit, showResend, resending, handleResend, requires2FA, otpToken, setOtpToken, onVerify2FA } = useLoginForm();

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
        <LoginForm 
          form={form} 
          onSubmit={onSubmit} 
          showResend={showResend} 
          resending={resending} 
          handleResend={handleResend}
          requires2FA={requires2FA}
          otpToken={otpToken}
          setOtpToken={setOtpToken}
          onVerify2FA={onVerify2FA}
        />
    </div>
  </div>
  );
}
