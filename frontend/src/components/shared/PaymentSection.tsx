import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentSectionProps {
  status: string;
  qrUrl: string;
  copy: () => void;
  copied: boolean;
  upiId: string;
  inv: any;
}

export function PaymentSection({ status, qrUrl, copy, copied, upiId, inv }: PaymentSectionProps) {
  return (
    <div className="lg:col-span-2 space-y-6">
      <div className="rounded-3xl bg-card border border-border shadow-pop p-6">
        <div className="text-center mb-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">Scan & Pay</div>
          <h3 className="text-base font-bold">Universal UPI Payment</h3>
        </div>

        <div className="relative mx-auto w-56 h-56 rounded-3xl bg-white p-4 shadow-card border border-border flex items-center justify-center overflow-hidden">
          {status === "PAID" ? (
            <div className="flex flex-col items-center gap-3 text-success animate-in zoom-in duration-500">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                 <Check className="h-10 w-10" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest">Fully Paid</span>
            </div>
          ) : (
            <img src={qrUrl} alt="Payment QR" className="w-full h-full object-contain" />
          )}
        </div>

        <div className="mt-8 space-y-3">
          <Button 
             variant="secondary" 
             className="w-full rounded-xl h-12 justify-between px-4" 
             onClick={copy}
             disabled={status === "PAID"}
          >
            <div className="text-left">
              <div className="text-[9px] uppercase font-bold opacity-60">Merchant UPI ID</div>
              <div className="text-xs font-mono font-bold truncate max-w-37.5">{upiId}</div>
            </div>
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>

          {status === "PAID" ? (
            <div className="w-full rounded-xl bg-success/10 text-success py-3 text-center font-bold">
              Payment Confirmed
            </div>
          ) : inv.paymentLink ? (
            <Button 
              className="w-full rounded-xl h-12 bg-primary text-primary-foreground font-black shadow-glow hover:scale-[1.01] transition-all"
              onClick={() => window.open(inv.paymentLink, "_blank")}
            >
              Pay via Razorpay (Online)
            </Button>
          ) : (
            <div className="text-center text-[10px] text-muted-foreground p-3 border border-dashed rounded-xl">
              Merchant has not enabled online payments.
            </div>
          )}
        </div>

        <p className="mt-6 text-[10px] text-center text-muted-foreground leading-relaxed font-medium">
          Payments are processed instantly. If you face issues, please contact the merchant directly at {inv.sme?.email}.
        </p>
      </div>
    </div>
  );
}
