import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VerifyEmailCardProps {
  status: "loading" | "success" | "error";
  message: string;
  onNavigate: (to: string) => void;
}

export function VerifyEmailCard({ status, message, onNavigate }: VerifyEmailCardProps) {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
           <Link to="/" className="flex items-center justify-center">
            <div className="h-12 w-[72px] rounded-lg border border-border bg-white overflow-hidden flex items-center justify-center shrink-0">
              <img src="/PayTracker-Logo.png" alt="Logo" className="h-full w-full object-cover" />
            </div>
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
            <Button onClick={() => onNavigate("/login")} className="w-full h-11 text-base">
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
            <Button onClick={() => onNavigate("/register")} variant="outline" className="w-full h-11 text-base">
              Back to Registration
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
