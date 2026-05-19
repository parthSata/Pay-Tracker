import { Link } from "@tanstack/react-router";
import { Loader2, CreditCard, Eye } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatINR } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ReceivedInvoicesTableProps {
  invoices: any[];
  isLoading: boolean;
}

export function ReceivedInvoicesTable({ invoices, isLoading }: ReceivedInvoicesTableProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/60 backdrop-blur z-10">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 font-medium">{t('inv_invoice')}</th>
              <th className="px-5 py-3 font-medium">{t('inv_sender')}</th>
              <th className="px-5 py-3 font-medium">{t('inv_amount')}</th>
              <th className="px-5 py-3 font-medium">{t('inv_due_date')}</th>
              <th className="px-5 py-3 font-medium">{t('inv_status')}</th>
              <th className="px-5 py-3 font-medium text-right">{t('inv_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-5 py-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>{t('inv_loading')}</p>
                  </div>
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  {t('inv_no_received')}
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv._id} className="group hover:bg-accent/40 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-medium text-foreground">{inv.invoiceNumber}</td>
                  <td className="px-5 py-3.5 font-medium">
                    {(inv.userId as any)?.businessName || (inv.userId as any)?.name || t('inv_unknown_business')}
                  </td>
                  <td className="px-5 py-3.5 font-semibold tabular-nums">{formatINR(inv.amount)}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {new Date(inv.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={inv.status.toLowerCase() as any} /></td>
                  <td className="px-5 py-3.5 text-right">
                    {inv.status.toLowerCase() === "paid" ? (
                      <Link 
                        to="/invoices/pay/$id"
                        params={{ id: inv._id }}
                        className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                      >
                        <Eye className="h-3 w-3" />
                        {t('inv_details')}
                      </Link>
                    ) : (
                      <Link 
                        to="/invoices/pay/$id"
                        params={{ id: inv._id }}
                        className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                      >
                        <CreditCard className="h-3 w-3" />
                        {t('inv_pay_now')}
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
