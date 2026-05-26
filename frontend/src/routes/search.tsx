import { createFileRoute, Link } from "@tanstack/react-router";
import { formatINR } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { InvoiceSearchForm } from "@/components/search/InvoiceSearchForm";
import { InvoiceSearchResult } from "@/components/search/InvoiceSearchResult";

export const Route = createFileRoute("/search")({
  component: InvoiceSearchPage,
});

import { useSearch } from "@/hooks/useSearch";
import { PrintInvoiceTemplate } from "@/components/invoices/PrintInvoiceTemplate";

function InvoiceSearchPage() {
  const {
    invoiceNumber, setInvoiceNumber,
    email, setEmail,
    invoice,
    isLoading,
    isUploading,
    qrCodeUrl,
    isCreator,
    handleSearch,
    downloadPDF,
    handleFileUpload
  } = useSearch();

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-8 py-4 sm:py-8">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-primary font-bold text-xl mb-4">
            <div className="h-8 w-8 bg-primary text-white rounded-lg flex items-center justify-center">P</div>
            Pay Tracker
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Find your invoice</h1>
          <p className="text-muted-foreground text-sm">Enter your details to view, pay, or download your invoice.</p>
        </div>

        <InvoiceSearchForm
          invoiceNumber={invoiceNumber}
          setInvoiceNumber={setInvoiceNumber}
          email={email}
          setEmail={setEmail}
          isLoading={isLoading}
          handleSearch={handleSearch}
        />

        {invoice && (
          <>
            <InvoiceSearchResult
              invoice={invoice}
              isCreator={isCreator}
              formatINR={formatINR}
              downloadPDF={downloadPDF}
              handleFileUpload={handleFileUpload}
              isUploading={isUploading}
              qrCodeUrl={qrCodeUrl}
            />
            {/* Hidden print container for capturing white professional A4 layout in PDF */}
            <div style={{ position: "fixed", left: "-9999px", top: "0", width: "794px", minHeight: "1123px", zIndex: -100 }}>
              <PrintInvoiceTemplate id="invoice-print-container" invoice={invoice} qrCodeUrl={qrCodeUrl} />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
