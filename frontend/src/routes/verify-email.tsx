import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useVerifyEmail } from "@/hooks/useVerifyEmail";
import { VerifyEmailCard } from "@/components/auth/VerifyEmailCard";

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmailComponent,
});

function VerifyEmailComponent() {
  const { token } = useSearch({ from: "/verify-email" }) as { token?: string };
  const navigate = useNavigate();
  const { status, message } = useVerifyEmail(token);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <VerifyEmailCard status={status as any} message={message} onNavigate={(to) => navigate({ to: to as any })} />
    </div>
  );
}
