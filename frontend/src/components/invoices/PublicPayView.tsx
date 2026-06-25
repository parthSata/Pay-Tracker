import { AppShell } from "@/components/layout/AppShell";
import { PublicInvoiceCard } from "@/components/invoices/PublicInvoiceCard";
import { PublicPaymentCard } from "@/components/invoices/PublicPaymentCard";
import { InvoiceTimeline } from "@/components/invoices/InvoiceTimeline";
import { PaymentAuditLog } from "@/components/invoices/PaymentAuditLog";
import { PrintInvoiceTemplate } from "@/components/invoices/PrintInvoiceTemplate";
import { Footer } from "@/components/layout/Footer";

interface PublicPayViewProps {
  user: any;
  isCreator: boolean;
  status: string;
  isVerifying: boolean;
  canResetLock?: boolean;
  paymentFailure?: { reason: string; code: string | null } | null;
  dismissPaymentFailure?: () => void;
  paymentLinkQrUrl?: string;
  total: number;
  downloadPDF: () => void;
  initiateOnlinePayment: () => void;
  openPaymentLink: () => void;
  resetPaymentLock?: () => void;
  displayEvents: any[];
  invoice: any;
}

export function PublicPayView({
  user,
  isCreator,
  status,
  isVerifying,
  canResetLock,
  paymentFailure,
  dismissPaymentFailure,
  paymentLinkQrUrl,
  total,
  downloadPDF,
  initiateOnlinePayment,
  openPaymentLink,
  resetPaymentLock,
  displayEvents,
  invoice
}: PublicPayViewProps) {
  const showPaymentPanel = !isCreator;
  const pageWidthClass = showPaymentPanel ? "max-w-375" : "max-w-5xl";
  const contentLayoutClass = showPaymentPanel
    ? "grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px] xl:items-start 2xl:grid-cols-[minmax(0,1.22fr)_460px]"
    : "space-y-6";

  return (
    <AppShell variant={user ? "app" : "minimal"} hideFooter={true}>
      <div className={`mx-auto w-full ${pageWidthClass} py-6 sm:py-8`}>
        <div className={contentLayoutClass}>
          <PublicInvoiceCard
            inv={invoice}
            total={total}
            status={status}
            paymentLinkQrUrl={paymentLinkQrUrl}
            openPaymentLink={openPaymentLink}
          />
          {showPaymentPanel && (
            <PublicPaymentCard
              isCreator={isCreator}
              status={status}
              isVerifying={isVerifying}
              canResetLock={canResetLock}
              paymentFailure={paymentFailure}
              dismissPaymentFailure={dismissPaymentFailure}
              inv={invoice}
              downloadPDF={downloadPDF}
              initiateOnlinePayment={initiateOnlinePayment}
              resetPaymentLock={resetPaymentLock}
            />
          )}
        </div>

        <PaymentAuditLog audit={invoice?.paymentAudit} isCreator={isCreator} />

        {isCreator && (
          <div className="mt-6">
            <InvoiceTimeline events={displayEvents} />
          </div>
        )}

        <Footer footerText={invoice?.sme?.footerText || invoice?.footerText} />
      </div>

      {/* Hidden print container for capturing white professional A4 layout in PDF */}
      <div style={{ position: "fixed", left: "-9999px", top: "0", width: "794px", minHeight: "1123px", zIndex: -100 }}>
        <PrintInvoiceTemplate id="invoice-print-container" invoice={invoice} />
      </div>
    </AppShell>
  );
}
