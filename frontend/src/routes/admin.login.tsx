import { createFileRoute } from "@tanstack/react-router";
import { useAdminLogin } from "@/hooks/useAdminLogin";
import { AdminLoginView } from "@/components/admin/AdminLoginView";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const loginProps = useAdminLogin();
  return <AdminLoginView {...loginProps} />;
}

export default AdminLogin;
