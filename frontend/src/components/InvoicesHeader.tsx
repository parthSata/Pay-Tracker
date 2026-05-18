import { Link } from "@tanstack/react-router";
import { Download, Plus } from "lucide-react";

interface InvoicesHeaderProps {
  invoicesCount: number;
  overdueCount: number;
  handleExport: () => void;
}

export function InvoicesHeader({ invoicesCount, overdueCount, handleExport }: InvoicesHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {invoicesCount} total · {overdueCount} need attention
        </p>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-accent transition-colors shadow-card"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
        <Link to="/invoices/new" className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-3.5 py-2 text-sm font-medium shadow-glow hover:scale-[1.02] transition-all">
          <Plus className="h-4 w-4" />
          New invoice
        </Link>
      </div>
    </div>
  );
}
