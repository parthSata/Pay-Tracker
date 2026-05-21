import { AppShell } from "@/components/layout/AppShell";
import { PublicInvoiceCard } from "@/components/invoices/PublicInvoiceCard";
import { PublicPaymentCard } from "@/components/invoices/PublicPaymentCard";
import { InvoiceTimeline } from "@/components/invoices/InvoiceTimeline";
import { PrintInvoiceTemplate } from "@/components/invoices/PrintInvoiceTemplate";

interface PublicPayViewProps {
  user: any;
  isCreator: boolean;
  status: string;
  qrUrl: string;
  total: number;
  upiId: string;
  copied: boolean;
  copy: () => Promise<void>;
  downloadPDF: () => void;
  displayEvents: any[];
  invoice: any;
}

export function PublicPayView({
  user,
  isCreator,
  status,
  qrUrl,
  total,
  upiId,
  copied,
  copy,
  downloadPDF,
  displayEvents,
  invoice
}: PublicPayViewProps) {
  return (
    <AppShell variant={user ? "app" : "minimal"}>
      <div className="max-w-5xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <PublicInvoiceCard inv={invoice} total={total} status={status} />
          <PublicPaymentCard
            isCreator={isCreator}
            status={status}
            qrUrl={qrUrl}
            copy={copy}
            copied={copied}
            upiId={upiId}
            inv={invoice}
            downloadPDF={downloadPDF}
          />
        </div>

        {isCreator && (
          <div className="mt-6">
            <InvoiceTimeline events={displayEvents} />
          </div>
        )}

        <p className="text-center text-[11px] text-muted-foreground mt-8">
          Need help? Email <span className="font-medium text-foreground">support@paytracker.com</span>
        </p>
      </div>

      {/* Hidden print container for capturing white professional A4 layout in PDF */}
      <div style={{ position: "absolute", left: "-9999px", top: "0", width: "794px", minHeight: "1123px", zIndex: -100 }}>
        <PrintInvoiceTemplate id="invoice-print-container" invoice={invoice} qrCodeUrl={qrUrl} />
      </div>
    </AppShell>
  );
}
