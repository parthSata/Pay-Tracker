import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Plus, Loader2 } from "lucide-react";
import { DashboardSummary } from "@/components/DashboardSummary";
import { CashflowChart } from "@/components/CashflowChart";
import { ExpectedRevenue } from "@/components/ExpectedRevenue";
import { WeeklyChart } from "@/components/WeeklyChart";
import { RecentInvoices } from "@/components/RecentInvoices";
import { ActivityLogs } from "@/components/ActivityLogs";
import { AppShell } from "@/components/AppShell";
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
              <CashflowChart data={dynamicCashflow} />
              <ExpectedRevenue pending={pending} pendingInvoicesCount={invoices.filter(i => i.status === 'PENDING').length} />
              <WeeklyChart data={dynamicWeekly} />
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
