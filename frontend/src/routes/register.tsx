import { createFileRoute, Link } from "@tanstack/react-router";
import { useRegisterForm } from "@/hooks/useRegisterForm";
import { RegisterForm } from "@/components/RegisterForm";

export const Route = createFileRoute("/register")({
  component: RegisterComponent,
});

function RegisterComponent() {
  const { form, onSubmit, checkEmail } = useRegisterForm();

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
        <RegisterForm form={form} onSubmit={onSubmit} checkEmail={checkEmail} />
    </div>
  </div>
  );
}
