import { Link } from "@tanstack/react-router";
import { Download, Upload, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

interface InvoiceSearchResultProps {
  invoice: any;
  isCreator: boolean;
  formatINR: (amount: number) => string;
  downloadPDF: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  qrCodeUrl: string;
}

export function InvoiceSearchResult({
  invoice,
  isCreator,
  formatINR,
  downloadPDF,
  handleFileUpload,
  isUploading,
  qrCodeUrl,
}: InvoiceSearchResultProps) {
  return (
    <div id="invoice-result" className="bg-card border border-border rounded-2xl overflow-hidden shadow-pop animate-fade-up">
      <div className="bg-primary/5 p-6 border-b border-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm">
            {(invoice.userId?.businessName || invoice.userId?.name || "B").split(" ").map((n: any) => n[0] || "").join("").slice(0, 2)}
          </div>
          <div>
            <div className="text-xs font-bold text-primary uppercase tracking-widest mb-0.5">Invoice Found</div>
            <h2 className="text-xl font-bold leading-none">{invoice.invoiceNumber}</h2>
          </div>
        </div>
        <StatusBadge status={invoice.status.toLowerCase() as any} />
      </div>
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Billed To</div>
            <div className="font-bold text-lg">{invoice.clientName}</div>
            <div className="text-sm text-muted-foreground">{invoice.clientEmail}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Amount Due</div>
            <div className="font-extrabold text-2xl text-foreground tabular-nums">{formatINR(invoice.totalAmount || invoice.amount)}</div>
            <div className="text-xs text-muted-foreground mt-1">Due {new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border">
          {invoice.status === "PAID" ? (
            <div className="flex-1 bg-success/10 text-success border border-success/20 font-bold py-3 rounded-xl text-center">
              Payment Received
            </div>
          ) : isCreator ? (
            <div className="flex-1 bg-primary/10 text-primary border border-primary/20 font-bold py-3 rounded-xl text-center">
              Invoice Created by You
            </div>
          ) : (
            <Link
              to="/pay/$id"
              params={{ id: invoice._id }}
              className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl text-center shadow-glow hover:opacity-90 transition-opacity"
            >
              Pay Now
            </Link>
          )}
          <button 
            onClick={downloadPDF}
            className="flex-1 border border-border bg-muted/30 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors print:hidden"
          >
            <Download className="h-5 w-5" />
            Download PDF
          </button>
        </div>


        <div className="pt-6 border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Payment QR</div>
              <div className="bg-white p-3 rounded-2xl inline-block border border-border shadow-sm">
                {qrCodeUrl && <img src={qrCodeUrl} alt="Payment QR" className="h-32 w-32" />}
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[180px]">
                Scan this code to quickly access the payment gateway on your mobile device.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Payment Proof</div>
              {invoice.paymentProof ? (
                <div className="relative group rounded-xl overflow-hidden border border-border aspect-video bg-muted">
                  <img src={invoice.paymentProof} crossOrigin="anonymous" alt="Payment Proof" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a href={invoice.paymentProof} target="_blank" rel="noreferrer" className="text-white text-xs font-bold bg-primary/80 px-3 py-1.5 rounded-lg">View Full</a>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-all">
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <div className="text-xs font-bold">Upload Screenshot</div>
                      <div className="text-[10px] text-muted-foreground">PNG, JPG up to 5MB</div>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
