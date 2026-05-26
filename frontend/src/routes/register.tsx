import { createFileRoute } from "@tanstack/react-router";
import { useRegisterForm } from "@/hooks/useRegisterForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Header } from "@/components/layout/Header";

export const Route = createFileRoute("/register")({
  component: RegisterComponent,
});

function RegisterComponent() {
  const { form, onSubmit, checkEmail } = useRegisterForm();

  return (
    <div className="min-h-screen bg-background">
      <Header variant="auth" />
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <RegisterForm form={form} onSubmit={onSubmit} checkEmail={checkEmail} />
    </div>
  </div>
  );
}
