import { Link } from "@tanstack/react-router";
import { Download, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface InvoicesHeaderProps {
  invoicesCount: number;
  overdueCount: number;
  handleExport: () => void;
}

export function InvoicesHeader({ invoicesCount, overdueCount, handleExport }: InvoicesHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t('inv_title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('inv_total_need_attention', { count: invoicesCount, overdue: overdueCount })}
        </p>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-accent transition-colors shadow-card"
        >
          <Download className="h-4 w-4" />
          {t('inv_export')}
        </button>
        <Link to="/invoices/new" className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-3.5 py-2 text-sm font-medium shadow-glow hover:scale-[1.02] transition-all">
          <Plus className="h-4 w-4" />
          {t('inv_new_invoice')}
        </Link>
      </div>
    </div>
  );
}
