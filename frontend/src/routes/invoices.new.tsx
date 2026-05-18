import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/invoices/new")({
  head: () => ({
    meta: [
      { title: "Create invoice — Pay Tracker" },
      { name: "description", content: "Create a professional invoice in seconds with live preview." },
    ],
  }),
  component: CreateInvoice,
});

import { useCreateInvoice, states } from "@/hooks/useCreateInvoice";
import { CreateInvoiceForm } from "@/components/invoices/CreateInvoiceForm";
import { InvoicePreview } from "@/components/invoices/InvoicePreview";

function CreateInvoice() {
  const {
    user,
    client, setClient,
    email, setEmail,
    amount, setAmount,
    due, setDue,
    notes, setNotes,
    clientState, setClientState,
    gstRate, setGstRate,
    isSubmitting,
    emailWarning,
    checkEmail,
    amountNum,
    gstAmount,
    total,
    taxType,
    handleSend
  } = useCreateInvoice();

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/invoices" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to invoices
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight mt-2">Create invoice</h1>
            <p className="text-sm text-muted-foreground mt-1">Fill in the details — your client sees the preview on the right.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <CreateInvoiceForm
            user={user}
            client={client} setClient={setClient}
            email={email} setEmail={setEmail}
            amount={amount} setAmount={setAmount}
            due={due} setDue={setDue}
            notes={notes} setNotes={setNotes}
            clientState={clientState} setClientState={setClientState}
            gstRate={gstRate} setGstRate={setGstRate}
            isSubmitting={isSubmitting}
            emailWarning={emailWarning}
            checkEmail={checkEmail}
            handleSend={handleSend}
            states={states}
          />
          <InvoicePreview
            user={user}
            client={client}
            email={email}
            due={due}
            amountNum={amountNum}
            taxType={taxType}
            gstRate={gstRate}
            gstAmount={gstAmount}
            total={total}
            notes={notes}
          />
        </div>
      </div>
    </AppShell>
  );
}
