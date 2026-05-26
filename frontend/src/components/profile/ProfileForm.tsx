import { useState } from "react";
import { Camera, Mail, MapPin, Building2, CreditCard, Save, BadgeCheck, Upload, Trash2, Shield, Palette, Sparkles, PenTool, Landmark, Loader2, Lock } from "lucide-react";
import { useProfileFormLogic } from "@/hooks/useProfileFormLogic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfileFormProps {
  user: any;
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSave: () => void;
  isLoading: boolean;
  isUploading: boolean;
  uploadingState: {
    logo: boolean;
    signature: boolean;
    avatar: boolean;
  };
  setVal: (key: string, value: any) => void;
  setBankDetail: (key: string, value: string) => void;
  uploadFile: (file: File, type: "logo" | "signature" | "avatar") => Promise<void>;
}

const PRESET_COLORS = [
  { name: "Indigo", hex: "#6366f1" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Sky", hex: "#0ea5e9" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Slate", hex: "#64748b" },
];

const TEMPLATES = [
  { id: "CLASSIC", name: "Classic Professional", desc: "Solid colored header and traditional clean structure" },
  { id: "MINIMAL", name: "Minimal Tech", desc: "Spacious layout with a thin primary colored left border" },
  { id: "CREATIVE", name: "Creative Bold", desc: "Vibrant brand colored sidebar for distinct branding" },
  { id: "MODERN", name: "Sleek Modern", desc: "Rounded cards, pill tags and soft shadows" },
];

export function ProfileForm({
  user,
  formData,
  handleChange,
  handleSave,
  isLoading,
  isUploading,
  uploadingState,
  setVal,
  setBankDetail,
  uploadFile
}: ProfileFormProps) {
  const isFree = user?.plan === "FREE";
  const { avatarInputRef, handleFileChange, removeImage } = useProfileFormLogic({
    setVal,
    uploadFile,
  });

  const [activeTab, setActiveTab] = useState<"personal" | "business">("personal");

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-up pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personalize your business identity, branding templates, bank details, and logo shown on every invoice.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isLoading || isUploading}
          className="gradient-primary text-primary-foreground shadow-glow hover:scale-[1.02] transition-transform disabled:opacity-50 h-11 px-6 rounded-xl font-semibold"
        >
          {isLoading ? "Saving..." : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="h-32 gradient-primary relative">
          <div className="absolute inset-0 gradient-mesh opacity-40" />
        </div>
        <div className="px-6 pb-6 -mt-12 flex flex-col sm:flex-row sm:items-end gap-5">
          <div className="relative">
            {formData.profilePic ? (
              <img 
                src={formData.profilePic} 
                alt="Avatar" 
                className="h-24 w-24 rounded-2xl object-cover ring-4 ring-card shadow-pop bg-muted" 
              />
            ) : (
              <div className="h-24 w-24 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center text-2xl font-bold ring-4 ring-card shadow-pop">
                {(formData.businessName || formData.name || "B").split(" ").map((n: any) => n[0] || "").join("").slice(0, 2).toUpperCase()}
              </div>
            )}
            {uploadingState?.avatar && (
              <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center text-white ring-4 ring-card">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            <input 
              type="file" 
              ref={avatarInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, "avatar")} 
              disabled={isUploading}
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-glow hover:scale-110 transition-transform"
              aria-label="Upload avatar"
              disabled={isUploading}
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              {user?.isVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success-soft px-2 py-0.5 rounded-full">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{formData.businessName || "Business Owner"}</p>
          </div>
          {formData.profilePic && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeImage("profilePic")}
              className="border-destructive/30 hover:bg-destructive/10 hover:text-destructive text-muted-foreground h-9 px-3 rounded-lg"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Remove Photo
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border border-border bg-card/30 backdrop-blur-md p-1.5 rounded-2xl gap-2 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("personal")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
            activeTab === "personal"
              ? "bg-primary text-primary-foreground shadow-glow scale-[1.02]"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <Mail className="h-4 w-4" />
          Personal Account
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("business")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
            activeTab === "business"
              ? "bg-primary text-primary-foreground shadow-glow scale-[1.02]"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Business Branding
        </button>
      </div>

      {activeTab === "personal" ? (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in w-full">
          {/* Personal Info */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Mail className="h-4.5 w-4.5 text-primary" /> Personal Info
            </h3>
            <Separator />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <Input name="name" value={formData.name} onChange={handleChange} maxLength={50} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input name="email" type="email" value={formData.email} onChange={handleChange} maxLength={100} className="h-10 rounded-xl" />
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in w-full">
          {/* Left Column: Basic Information */}
          <div className="md:col-span-1 space-y-6">
            {/* Business Details */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-primary" /> Business Details
              </h3>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Business Name</Label>
                  <Input name="businessName" value={formData.businessName} onChange={handleChange} maxLength={50} className="h-10 rounded-xl" />
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-primary" /> UPI Payment
              </h3>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">UPI ID</Label>
                  <Input name="upiId" value={formData.upiId} onChange={handleChange} placeholder="merchant@upi" maxLength={50} className="h-10 rounded-xl" />
                </div>
                <div className="flex items-start gap-2.5 rounded-xl bg-primary-soft text-primary p-3 text-xs">
                  <MapPin className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <p>Clients scan the QR code generated from your UPI ID directly on your invoice pay page.</p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Branding & Customization */}
          <div className="md:col-span-2 space-y-8">
          {/* Logo & Watermark Section */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-primary" /> Company Logo & Watermark
            </h3>
            <Separator />

            <div className="grid sm:grid-cols-2 gap-6 items-center">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-3 block">Logo Image</Label>
                {uploadingState?.logo ? (
                  <div className="border border-border rounded-xl p-6 bg-muted/20 flex flex-col items-center justify-center gap-2 min-h-[142px]">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <div className="text-xs font-semibold">Uploading...</div>
                  </div>
                ) : formData.logoUrl ? (
                  <div className="relative group border border-border rounded-xl p-4 bg-muted/20 flex flex-col items-center gap-3">
                    <img src={formData.logoUrl} alt="Logo Preview" className="h-20 max-w-full object-contain rounded" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeImage("logoUrl")}
                      className="border-destructive/30 hover:bg-destructive/10 hover:text-destructive text-muted-foreground h-8 px-2 rounded-lg text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove Logo
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-all">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <div className="text-xs font-semibold">Upload Logo</div>
                    <div className="text-[10px] text-muted-foreground">PNG, JPG up to 10MB</div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, "logo")} 
                      disabled={isUploading} 
                    />
                  </label>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      Enable Watermark
                      {isFree && <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isFree ? "🔒 Premium feature: upgrade to enable" : "Superimpose logo in background"}
                    </p>
                  </div>
                  <Switch 
                    checked={formData.watermarkEnabled} 
                    onCheckedChange={(checked) => setVal("watermarkEnabled", checked)} 
                    disabled={!formData.logoUrl || isFree}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Watermark Opacity</Label>
                    <span className="text-xs font-semibold text-primary">{Math.round(formData.watermarkOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.30"
                    step="0.01"
                    value={formData.watermarkOpacity}
                    onChange={(e) => setVal("watermarkOpacity", parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
                    disabled={!formData.watermarkEnabled || !formData.logoUrl || isFree}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Brand Colors and Template Choice */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Palette className="h-4.5 w-4.5 text-primary" /> Invoice Theme & Color
            </h3>
            <Separator />

            {/* Template Choice */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground block">Invoice Template Style</Label>
              <div className="grid sm:grid-cols-2 gap-4">
                {TEMPLATES.map((tmpl) => {
                  const isLockedTemplate = isFree && tmpl.id !== "CLASSIC";
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      disabled={isLockedTemplate}
                      onClick={() => setVal("brandTemplate", tmpl.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between h-28 hover:border-primary/50 bg-card relative ${
                        formData.brandTemplate === tmpl.id ? "border-primary shadow-glow bg-primary/5" : "border-border shadow-sm"
                      } ${isLockedTemplate ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <div>
                        <div className="font-semibold text-sm flex items-center justify-between">
                          {tmpl.name}
                          {isLockedTemplate ? (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                          ) : (
                            formData.brandTemplate === tmpl.id && <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {isLockedTemplate ? "Upgrade to Paid to unlock this template" : tmpl.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-4">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground block">Brand Accent Color</Label>
              <div className="flex flex-wrap items-center gap-3">
                {PRESET_COLORS.map((color) => {
                  const isLockedColor = isFree && color.hex !== "#6366f1";
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      disabled={isLockedColor}
                      onClick={() => {
                        setVal("brandColor", color.hex);
                      }}
                      className={`h-8 px-3 rounded-full text-xs font-bold border-2 transition-all flex items-center gap-1.5 ${
                        formData.brandColor === color.hex ? "border-foreground scale-105 shadow-md" : "border-transparent"
                      } ${isLockedColor ? "opacity-50 cursor-not-allowed" : ""}`}
                      style={{ backgroundColor: color.hex, color: "#ffffff" }}
                    >
                      {color.name}
                      {isLockedColor && <Lock className="h-2.5 w-2.5 ml-0.5 text-white/80" />}
                    </button>
                  );
                })}
                
                {/* Custom Color Picker */}
                <div className={`flex items-center gap-2 border border-border rounded-full px-3 py-1 shadow-sm bg-muted/20 ${isFree ? "opacity-50 cursor-not-allowed select-none" : ""}`}>
                  <input
                    type="color"
                    disabled={isFree}
                    value={formData.brandColor}
                    onChange={(e) => setVal("brandColor", e.target.value)}
                    className="w-6 h-6 rounded-full border-none cursor-pointer bg-transparent disabled:cursor-not-allowed"
                  />
                  <span className="text-xs font-semibold uppercase flex items-center gap-1.5">
                    {formData.brandColor}
                    {isFree && <Lock className="h-3 w-3 text-muted-foreground/60" />}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Bank Details Section */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Landmark className="h-4.5 w-4.5 text-primary" /> Bank Transfer Details
            </h3>
            <Separator />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bank Name</Label>
                <Input 
                  value={formData.bankDetails.bankName} 
                  onChange={(e) => setBankDetail("bankName", e.target.value)} 
                  placeholder="e.g. HDFC Bank"
                  maxLength={50}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Account Holder Name</Label>
                <Input 
                  value={formData.bankDetails.accountName} 
                  onChange={(e) => setBankDetail("accountName", e.target.value)} 
                  placeholder="e.g. Acme Corp"
                  maxLength={50}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Account Number</Label>
                <Input 
                  value={formData.bankDetails.accountNumber} 
                  onChange={(e) => setBankDetail("accountNumber", e.target.value)} 
                  placeholder="e.g. 5010023456789"
                  maxLength={30}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">IFSC Code</Label>
                <Input 
                  value={formData.bankDetails.ifscCode} 
                  onChange={(e) => setBankDetail("ifscCode", e.target.value.toUpperCase())} 
                  placeholder="e.g. HDFC0000240"
                  maxLength={15}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Branch Name</Label>
                <Input 
                  value={formData.bankDetails.branchName} 
                  onChange={(e) => setBankDetail("branchName", e.target.value)} 
                  placeholder="e.g. Connaught Place, New Delhi"
                  maxLength={100}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
          </section>

          {/* Signature Verification */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <PenTool className="h-4.5 w-4.5 text-primary" /> Authorized Signature
            </h3>
            <Separator />

            <div className="space-y-4">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground block">Signature Type</Label>
              <div className="flex flex-wrap gap-4">
                {["NONE", "TYPED", "UPLOAD"].map((type) => {
                  const isLockedSig = isFree && type !== "NONE";
                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={isLockedSig}
                      onClick={() => setVal("signatureType", type)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border-2 transition-all flex items-center gap-1.5 ${
                        formData.signatureType === type ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted/30"
                      } ${isLockedSig ? "opacity-55 cursor-not-allowed" : ""}`}
                    >
                      {type === "NONE" ? "None / Disabled" : type === "TYPED" ? "Type Signature (Cursive)" : "Upload Image"}
                      {isLockedSig && <Lock className="h-3 w-3 text-muted-foreground/60" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {formData.signatureType === "TYPED" && (
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Signature Text</Label>
                  <Input 
                    name="signatureText" 
                    value={formData.signatureText} 
                    onChange={handleChange} 
                    placeholder="Enter your name" 
                    maxLength={30}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Select Font Style</Label>
                  <Select 
                    value={formData.signatureFont} 
                    onValueChange={(val) => setVal("signatureFont", val)}
                  >
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dancing Script">Dancing Script (Classic)</SelectItem>
                      <SelectItem value="Playball">Playball (Sporty/Cursive)</SelectItem>
                      <SelectItem value="Sacramento">Sacramento (Ultra Elegant)</SelectItem>
                      <SelectItem value="Pacifico">Pacifico (Bold/Retro)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Signature Preview */}
                <div className="sm:col-span-2 border border-border rounded-xl p-4 bg-muted/10 flex flex-col items-center justify-center gap-1 min-h-[90px]">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 select-none">Preview Signature</div>
                  <div 
                    className="text-3xl select-none py-1"
                    style={{ 
                      fontFamily: `'${formData.signatureFont}', cursive, sans-serif`,
                      color: formData.brandColor 
                    }}
                  >
                    {formData.signatureText || user?.name || "Your Signature"}
                  </div>
                </div>
              </div>
            )}

            {formData.signatureType === "UPLOAD" && (
              <div className="pt-2">
                {uploadingState?.signature ? (
                  <div className="border border-border rounded-xl p-6 bg-muted/20 flex flex-col items-center justify-center gap-2 min-h-[142px]">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <div className="text-xs font-semibold">Uploading...</div>
                  </div>
                ) : formData.signatureUrl ? (
                  <div className="relative group border border-border rounded-xl p-4 bg-muted/20 flex flex-col items-center gap-3">
                    <img src={formData.signatureUrl} alt="Signature Upload" className="h-16 max-w-full object-contain rounded" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeImage("signatureUrl")}
                      className="border-destructive/30 hover:bg-destructive/10 hover:text-destructive text-muted-foreground h-8 px-2 rounded-lg text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove Signature
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-all">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <div className="text-xs font-semibold">Upload Signature Image</div>
                    <div className="text-[10px] text-muted-foreground">PNG, JPG up to 10MB (Transparent PNG is recommended)</div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, "signature")} 
                      disabled={isUploading} 
                    />
                  </label>
                )}
              </div>
            )}
          </section>

          {/* Footer Text */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-primary" /> Invoice Footer Text
            </h3>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Custom Footer Text</Label>
              <textarea
                name="footerText"
                value={formData.footerText}
                onChange={handleChange}
                placeholder="e.g. Thank you for your business! Payment is due within 15 days of invoice date."
                maxLength={200}
                className="w-full min-h-[80px] text-sm bg-background border border-border rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-[10px] text-muted-foreground">This text is shown at the very bottom of your generated invoices.</p>
            </div>
          </section>
        </div>
      </div>
      )}
    </div>
  );
}
