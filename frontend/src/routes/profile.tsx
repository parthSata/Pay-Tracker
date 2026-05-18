import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { hasStoredSession } from "@/lib/session";
export const Route = createFileRoute("/profile")({
  beforeLoad: () => {
    if (!hasStoredSession()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Profile — Pay Tracker" },
      { name: "description", content: "Manage your business profile, contact info and payment details." },
    ],
  }),
  component: ProfilePage,
});

import { useProfile } from "@/hooks/useProfile";
import { ProfileForm } from "@/components/profile/ProfileForm";

function ProfilePage() {
  const {
    user,
    isLoading,
    formData,
    handleSave,
    handleChange
  } = useProfile();

  return (
    <AppShell>
        <ProfileForm user={user} formData={formData} handleChange={handleChange} handleSave={handleSave} isLoading={isLoading} />
    </AppShell>
  );
}


