import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../auth";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  businessName: z.string().optional(),
  upiId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export function useRegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      businessName: "",
      upiId: "",
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    try {
      await register(data);
      toast.success("Registration successful! Please check your mailbox to verify your account.");
      await navigate({ to: "/login" });
    } catch (error) {
      // Error handled by AuthProvider toast
    }
  }

  const checkEmail = async (email: string) => {
    if (!email || !email.includes('@')) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/users/check-email?email=${email}`);
      const { exists, isVerified } = res.data?.data || {};
      
      if (exists) {
        if (isVerified) {
          form.setError("email", { type: "manual", message: "Email is already registered and verified" });
        } else {
          form.setError("email", { type: "manual", message: "Email registered but not verified. Try registering to resend link." });
        }
      } else {
        form.clearErrors("email");
      }
    } catch (e) {
      // ignore
    }
  };

  return {
    form,
    onSubmit,
    checkEmail
  };
}
