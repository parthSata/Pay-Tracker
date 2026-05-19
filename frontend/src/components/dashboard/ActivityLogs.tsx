import { CheckCircle2, Plus, Upload, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ActivityLogsProps {
  logs: any[];
}

export function ActivityLogs({ logs }: ActivityLogsProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden animate-fade-up" style={{ animationDelay: "440ms" }}>
      <div className="p-5 border-b border-border">
        <h2 className="text-base font-semibold">{t('dashboard_activity_logs')}</h2>
        <p className="text-xs text-muted-foreground">{t('dashboard_activity_logs_desc')}</p>
      </div>
      <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t('dashboard_no_activity_logs')}
          </div>
        ) : (
          logs.map((log) => (
            <div key={log._id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-accent/40 transition-colors">
              <div className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${log.action === 'PAYMENT_RECEIVED' ? 'bg-success-soft text-success' :
                log.action === 'INVOICE_CREATED' ? 'bg-primary-soft text-primary' :
                  log.action === 'PAYMENT_PROOF_UPLOADED' ? 'bg-warning-soft text-warning' :
                    'bg-muted text-muted-foreground'
                }`}>
                {log.action === 'PAYMENT_RECEIVED' ? <CheckCircle2 className="h-4 w-4" /> :
                  log.action === 'INVOICE_CREATED' ? <Plus className="h-4 w-4" /> :
                    log.action === 'PAYMENT_PROOF_UPLOADED' ? <Upload className="h-4 w-4" /> :
                      <Clock className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground">{log.details}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-tight">
                  {new Date(log.createdAt).toLocaleString("en-IN", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
