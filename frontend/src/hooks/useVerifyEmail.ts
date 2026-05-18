import { useState, useEffect, useRef } from "react";
import axios from "axios";

export function useVerifyEmail(token?: string) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const called = useRef(false);

  useEffect(() => {
    if (!token || called.current) return;

    const verify = async () => {
      called.current = true;
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/verify-email?token=${token}`);
        setStatus("success");
        setMessage(response.data.message || "Email verified successfully!");
      } catch (error: any) {
        if (error.response?.data?.message?.includes("already verified")) {
          setStatus("success");
          setMessage("Email is already verified!");
        } else {
          setStatus("error");
          setMessage(error.response?.data?.message || "Verification failed. The link may be expired.");
        }
      }
    };

    verify();
  }, [token]);

  return { status, message };
}
