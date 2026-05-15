import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmailComponent,
});

function VerifyEmailComponent() {
  const { token } = useSearch({ from: "/verify-email" }) as { token?: string };
  const navigate = useNavigate();
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
        // If the backend says already verified, treat as success
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
  }, [token, called]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
             <Link to="/" className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl overflow-hidden border border-border bg-white shadow-sm">
                <img src="/PayTracker-Logo.png" alt="Logo" className="h-full w-full object-cover" />
              </div>
              <span className="font-bold text-primary text-2xl tracking-tight">Pay Tracker</span>
            </Link>
          </div>
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {status === "loading" ? "We are verifying your email address..." : "Verification complete"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-6 text-center">
          {status === "loading" && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
              <p className="text-muted-foreground font-medium">Please wait a moment</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-full inline-block">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold text-foreground">{message}</p>
                <p className="text-muted-foreground">You can now access all features of Pay Tracker.</p>
              </div>
              <Button onClick={() => navigate({ to: "/login" })} className="w-full h-11 text-base">
                Go to Login
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6">
              <div className="bg-red-50 p-4 rounded-full inline-block">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold text-foreground">{message}</p>
                <p className="text-muted-foreground">Please try again or contact support if the problem persists.</p>
              </div>
              <Button onClick={() => navigate({ to: "/register" })} variant="outline" className="w-full h-11 text-base">
                Back to Registration
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
