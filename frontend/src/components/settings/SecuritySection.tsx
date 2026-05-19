import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { Panel, Row } from "@/components/settings/SettingsComponents";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "@/auth";
import { useEffect } from "react";

export function SecuritySection() {
  const { user, setUser } = useAuth();
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.isTwoFactorEnabled || false);
  const [showModal, setShowModal] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);

  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error("All password fields are required");
    }
    if (newPassword.length < 6) {
      return toast.error("New password must be at least 6 characters long");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("New password and confirm password do not match");
    }
    if (newPassword === currentPassword) {
      return toast.error("New password cannot be the same as your current password");
    }

    setUpdatingPassword(true);
    try {
      const token = localStorage.getItem("pay_tracker_token");
      await axios.post(`${import.meta.env.VITE_API_URL}/users/change-password`, {
        oldPassword: currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  useEffect(() => {
    if (showModal || showDisableModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal, showDisableModal]);

  const handleToggle2FA = async (checked: boolean) => {
    if (checked) {
      setLoading(true);
      try {
        const token = localStorage.getItem("pay_tracker_token");
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/users/2fa/generate`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQrCode(res.data.data.qrCodeUrl);
        setShowModal(true);
      } catch (err: any) {
        toast.error("Failed to generate 2FA");
      } finally {
        setLoading(false);
      }
    } else {
      setShowDisableModal(true);
    }
  };

  const verifyAndDisable = async () => {
    if (!disablePassword) return toast.error("Password is required");
    if (disableCode.length !== 6) return toast.error("Invalid 2FA code");
    
    setLoading(true);
    try {
      const token = localStorage.getItem("pay_tracker_token");
      await axios.post(`${import.meta.env.VITE_API_URL}/users/2fa/disable`, { 
        token: disableCode, 
        password: disablePassword 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIs2FAEnabled(false);
      setUser({ ...user!, isTwoFactorEnabled: false } as any);
      setShowDisableModal(false);
      setDisablePassword("");
      setDisableCode("");
      toast.success("2FA disabled successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (otpCode.length !== 6) return toast.error("Invalid code");
    try {
      const token = localStorage.getItem("pay_tracker_token");
      await axios.post(`${import.meta.env.VITE_API_URL}/users/2fa/enable`, { token: otpCode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIs2FAEnabled(true);
      setUser({ ...user!, isTwoFactorEnabled: true } as any);
      setShowModal(false);
      setOtpCode("");
      toast.success("2FA enabled successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid 2FA code");
    }
  };
  return (
    <>
      <Panel title="Password" description="Use a strong, unique password.">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Current</Label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">New</Label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Confirm</Label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button 
            onClick={handleUpdatePassword} 
            disabled={updatingPassword} 
            className="gradient-primary text-primary-foreground"
          >
            {updatingPassword ? "Updating..." : "Update password"}
          </Button>
        </div>
      </Panel>

      <Panel title="Two-factor authentication" description="Add an extra layer of security to your account.">
        <Row
          title="Authenticator app"
          description="Use TOTP codes from Google Authenticator, 1Password, etc."
          control={<Switch checked={is2FAEnabled} onCheckedChange={handleToggle2FA} disabled={loading} />}
        />
        {is2FAEnabled && (
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-success-soft text-success p-3 text-xs animate-fade-in">
            <Shield className="h-4 w-4 shrink-0 mt-0.5" />
            <p>2FA is currently active. Your account is secure.</p>
          </div>
        )}
      </Panel>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-2xl p-6 shadow-pop animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-center mb-2">Setup Authenticator</h3>
            <p className="text-xs text-muted-foreground text-center mb-6">Scan the QR code below with your Authenticator app (e.g. Google Authenticator, Authy).</p>
            
            <div className="flex justify-center bg-white p-4 rounded-xl border mb-6 mx-auto w-48 h-48">
              {qrCode ? (
                <img src={qrCode} alt="2FA QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full animate-pulse bg-muted/30 rounded" />
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Enter 6-digit code</Label>
              <Input 
                autoFocus
                placeholder="123456" 
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="text-center tracking-widest text-lg font-mono"
              />
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={verifyAndEnable} disabled={otpCode.length !== 6}>Verify</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDisableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-2xl p-6 shadow-pop animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-center mb-2">Disable 2FA</h3>
            <p className="text-xs text-muted-foreground text-center mb-6">Confirm your password and enter the authenticator code to disable Two-Factor Authentication.</p>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Confirm Password</Label>
                <Input 
                  type="password"
                  placeholder="••••••••"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Authenticator Code</Label>
                <Input 
                  placeholder="123456" 
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="text-center tracking-widest text-lg font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => {
                  setShowDisableModal(false);
                  setDisablePassword("");
                  setDisableCode("");
                }}>Cancel</Button>
                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={verifyAndDisable} disabled={loading || !disablePassword || disableCode.length !== 6}>
                  Disable
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
