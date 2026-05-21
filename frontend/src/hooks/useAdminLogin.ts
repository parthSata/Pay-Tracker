import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../auth";
import { toast } from "sonner";

export const adminLoginSchema = z.object({
  adminEmail: z.string().email("Invalid admin email"),
  adminCode: z.string().min(4, "Admin code must be at least 4 characters"),
});

export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export function useAdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      adminEmail: "",
      adminCode: "",
    },
  });

  async function onSubmit(data: AdminLoginFormValues) {
    try {
      await login(data.adminEmail, data.adminCode);
      toast.success("Admin access granted!");
      navigate({ to: "/admin/dashboard" });
    } catch (error) {
      toast.error("Invalid admin credentials.");
    }
  }

  return {
    form,
    onSubmit,
    navigate,
  };
}
