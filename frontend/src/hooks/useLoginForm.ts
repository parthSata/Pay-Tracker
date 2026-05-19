import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../auth";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export function useLoginForm() {
  const { login, logout, verify2FA } = useAuth();
  const navigate = useNavigate();
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [otpToken, setOtpToken] = useState("");
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setShowResend(false);
    try {
      const userData: any = await login(data.email, data.password);
      if (userData?.requires2FA) {
        setRequires2FA(true);
        setTempToken(userData.tempToken);
        toast.info("Two-factor authentication required.");
        return;
      }
      if (userData && userData.role === "ADMIN") {
        toast.error("Admins must login through the admin portal.");
        logout();
        navigate({ to: "/admin/login" });
      } else {
        toast.success("Logged in successfully!");
        await navigate({ to: "/" });
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        setShowResend(true);
      }
    }
  }

  const handleResend = async () => {
    const email = form.getValues("email");
    if (!email) return;

    setResending(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/users/resend-verification`, { email });
      toast.success("Verification link resent! Please check your inbox.");
      setShowResend(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to resend link");
    } finally {
      setResending(false);
    }
  };

  const onVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken || otpToken.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    try {
      const userData = await verify2FA(tempToken, otpToken);
      if (userData && userData.role === "ADMIN") {
        toast.error("Admins must login through the admin portal.");
        logout();
        navigate({ to: "/admin/login" });
      } else {
        await navigate({ to: "/" });
      }
    } catch (error: any) {
      // toast error handled in hook
    }
  };

  return {
    form,
    onSubmit,
    showResend,
    resending,
    handleResend,
    requires2FA,
    otpToken,
    setOtpToken,
    onVerify2FA
  };
}
