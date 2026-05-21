import { createFileRoute, redirect } from '@tanstack/react-router';
import { hasStoredSession } from "@/lib/session";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";

export const Route = createFileRoute("/admin/dashboard")({
  beforeLoad: ({ context }) => {
    const storedUser = localStorage.getItem("pay_tracker_user");
    const user = context.auth.user || (storedUser ? JSON.parse(storedUser) : null);

    if (!hasStoredSession() || user?.role !== "ADMIN") {
      throw redirect({ to: "/admin/login" });
    }
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const adminProps = useAdminDashboard();
  return <AdminDashboardView {...adminProps} />;
}

export default AdminDashboard;
