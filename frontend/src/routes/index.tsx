import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Plus, Loader2 } from "lucide-react";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { DailyCashPosition } from "@/components/dashboard/DailyCashPosition";
import { CashflowChart } from "@/components/dashboard/CashflowChart";
import { ExpectedRevenue } from "@/components/dashboard/ExpectedRevenue";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { RecentInvoices } from "@/components/dashboard/RecentInvoices";
import { ActivityLogs } from "@/components/dashboard/ActivityLogs";
import { RecoveryRateGauge } from "@/components/dashboard/RecoveryRateGauge";
import { CollectedVsPending } from "@/components/dashboard/CollectedVsPending";
import { RecoveryEfficiency } from "@/components/dashboard/RecoveryEfficiency";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "../auth";
import { hasStoredSession } from "@/lib/session";
import { useDashboard } from "@/hooks/useDashboard";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (!hasStoredSession()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Dashboard — Pay Tracker" },
      { name: "description", content: "Track revenue, pending payments, and cashflow forecast in one place." },
    ],
  }),
  component: Dashboard,
});



function Dashboard() {
  const { user } = useAuth();
  const {
    invoices,
    receivedInvoices,
    logs,
    isLoading,
    totalRevenue,
    pending,
    overdue,
    dynamicCashflow,
    dynamicWeekly
  } = useDashboard();

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Good evening, {user?.name.split(' ')[0] || "User"} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here's what's happening with your cashflow today.
            </p>
          </div>
          <Link
            to="/invoices/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium shadow-glow hover:scale-[1.02] hover:shadow-pop transition-all"
          >
            <Plus className="h-4 w-4" />
            New invoice
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DashboardSummary totalRevenue={totalRevenue} pending={pending} overdue={overdue} />

            <DailyCashPosition invoices={invoices} receivedInvoices={receivedInvoices} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
              <CashflowChart data={dynamicCashflow} />
              <ExpectedRevenue pending={pending} pendingInvoicesCount={invoices.filter(i => i.status === 'PENDING').length} />
              
              <WeeklyChart data={dynamicWeekly} />
              <RecoveryRateGauge invoices={invoices} />
              <CollectedVsPending invoices={invoices} />

              <RecoveryEfficiency invoices={invoices} className="lg:col-span-3" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <RecentInvoices invoices={invoices} />
              <ActivityLogs logs={logs} />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
