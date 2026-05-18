import { FileText, Search, Loader2 } from "lucide-react";

interface InvoiceSearchFormProps {
  invoiceNumber: string;
  setInvoiceNumber: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  isLoading: boolean;
  handleSearch: (e: React.FormEvent) => void;
}

export function InvoiceSearchForm({
  invoiceNumber,
  setInvoiceNumber,
  email,
  setEmail,
  isLoading,
  handleSearch,
}: InvoiceSearchFormProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-card print:hidden">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Invoice ID</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-2026-XXXX"
                className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Client Email</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>
        <button
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl shadow-glow hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search Invoice"}
        </button>
      </form>
    </div>
  );
}
