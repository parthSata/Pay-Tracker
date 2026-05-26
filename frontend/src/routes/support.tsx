import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "../auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Mail, MessageSquare, Send, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support Center — Pay Tracker" },
      { name: "description", content: "Frequently asked questions and contact support for Pay Tracker." },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast.error(t("support_contact_error"));
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success(t("support_contact_success"));
      setSubject("");
      setMessage("");
    }, 1500);
  };

  return (
    <AppShell variant={user ? "app" : "minimal"}>
      <div className="max-w-5xl mx-auto space-y-10 animate-fade-up py-4 px-2">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-primary/10 text-primary items-center justify-center shadow-card">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{t("support_title")}</h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">{t("support_subtitle")}</p>
        </div>

        {/* Support channels quick action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-2xl border border-border bg-card shadow-card hover:shadow-pop transition-all duration-300">
            <CardHeader className="flex flex-row items-center gap-4 pb-3">
              <div className="h-10 w-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">{t("support_card_email_title")}</CardTitle>
                <CardDescription className="text-xs">{t("support_card_email_desc")}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold text-primary">support@paytracker.com</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-card hover:shadow-pop transition-all duration-300">
            <CardHeader className="flex flex-row items-center gap-4 pb-3">
              <div className="h-10 w-10 rounded-xl bg-success-soft text-success flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">{t("support_card_chat_title")}</CardTitle>
                <CardDescription className="text-xs">{t("support_card_chat_desc")}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Agents Online
              </span>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">{t("support_faq_title")}</h2>
            </div>
            
            <Card className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="font-semibold text-sm hover:no-underline">{t("support_faq_q1")}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs leading-relaxed">
                    {t("support_faq_a1")}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="font-semibold text-sm hover:no-underline">{t("support_faq_q2")}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs leading-relaxed">
                    {t("support_faq_a2")}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="font-semibold text-sm hover:no-underline">{t("support_faq_q3")}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs leading-relaxed">
                    {t("support_faq_a3")}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger className="font-semibold text-sm hover:no-underline">{t("support_faq_q4")}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs leading-relaxed">
                    {t("support_faq_a4")}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </div>

          {/* Contact Support Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">{t("support_contact_title")}</h2>
            </div>

            <Card className="rounded-2xl border border-border bg-card shadow-card">
              <CardContent className="p-6">
                {submitted ? (
                  <div className="text-center py-8 space-y-4 animate-scale-in">
                    <div className="mx-auto h-12 w-12 rounded-full bg-success/10 text-success flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-foreground">Message Sent!</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t("support_contact_success")}
                      </p>
                    </div>
                    <Button onClick={() => setSubmitted(false)} variant="outline" className="w-full rounded-xl">
                      Send another message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      {t("support_contact_desc")}
                    </p>

                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs text-muted-foreground font-medium">{t("support_contact_name")}</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="rounded-xl h-10 text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs text-muted-foreground font-medium">{t("support_contact_email")}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded-xl h-10 text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="subject" className="text-xs text-muted-foreground font-medium">{t("support_contact_subject")}</Label>
                      <Input
                        id="subject"
                        type="text"
                        placeholder="How can we help?"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="rounded-xl h-10 text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="message" className="text-xs text-muted-foreground font-medium">{t("support_contact_message")}</Label>
                      <Textarea
                        id="message"
                        placeholder="Describe your issue..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="rounded-xl min-h-[100px] text-sm resize-none"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-xl gap-2 h-10 font-semibold"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          {t("support_contact_submit")}
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
