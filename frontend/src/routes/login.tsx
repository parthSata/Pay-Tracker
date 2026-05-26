import { createFileRoute } from "@tanstack/react-router";
import { useLoginForm } from "@/hooks/useLoginForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { Header } from "@/components/layout/Header";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const { form, onSubmit, showResend, resending, handleResend, requires2FA, otpToken, setOtpToken, onVerify2FA } = useLoginForm();

  return (
    <div className="min-h-screen bg-background">
      <Header variant="auth" />
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
