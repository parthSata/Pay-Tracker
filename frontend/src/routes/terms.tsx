import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "../auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Scale, Info } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Pay Tracker" },
      { name: "description", content: "Terms of Service and legal agreements for using Pay Tracker." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <AppShell variant={user ? "app" : "minimal"}>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-up py-4 px-2">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-primary/10 text-primary items-center justify-center shadow-card">
            <Scale className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{t("terms_title")}</h1>
          <p className="text-sm text-muted-foreground">{t("terms_last_updated")}</p>
        </div>

        {/* Intro Alert */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex gap-4">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("terms_intro")}
          </p>
        </div>

        {/* Content Cards */}
        <div className="space-y-6">
          <Card className="rounded-2xl border border-border bg-card shadow-card hover:shadow-pop transition-all duration-300">
            <CardHeader className="flex flex-row items-center gap-4 pb-3">
              <div className="h-10 w-10 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-bold">{t("terms_sec1_title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("terms_sec1_desc")}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-card hover:shadow-pop transition-all duration-300">
            <CardHeader className="flex flex-row items-center gap-4 pb-3">
              <div className="h-10 w-10 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-bold">{t("terms_sec2_title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("terms_sec2_desc")}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-card hover:shadow-pop transition-all duration-300">
            <CardHeader className="flex flex-row items-center gap-4 pb-3">
              <div className="h-10 w-10 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
                <Scale className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-bold">{t("terms_sec3_title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("terms_sec3_desc")}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-card hover:shadow-pop transition-all duration-300">
            <CardHeader className="flex flex-row items-center gap-4 pb-3">
              <div className="h-10 w-10 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
                <Info className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-bold">{t("terms_sec4_title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("terms_sec4_desc")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
