import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Search,
  Sparkles,
  CreditCard,
  Users,
} from "lucide-react";
import { isNavActive } from "@/lib/navActive";

const nav: { to: string; labelKey: string; icon: any; isPremium?: boolean }[] = [
  { to: "/", labelKey: "nav_dashboard", icon: LayoutDashboard },
  { to: "/invoices", labelKey: "nav_invoices", icon: FileText },
  { to: "/invoices/received", labelKey: "nav_received", icon: CreditCard },
  { to: "/clients", labelKey: "nav_clients", icon: Users },
  { to: "/invoices/new", labelKey: "nav_create", icon: PlusCircle },
  { to: "/search", labelKey: "nav_search", icon: Search },
];

export type AppShellVariant = "app" | "minimal";

import { useAppShell } from "@/hooks/useAppShell";

export function AppShell({
  children,
  variant = "app",
  hideFooter = false,
}: {
  children: ReactNode;
  variant?: AppShellVariant;
  hideFooter?: boolean;
}) {
  const {
    t,
    pathname,
    user,
    isMinimal,
  } = useAppShell({ variant });

  return (
    <div className="min-h-dvh flex w-full bg-background gradient-mesh">
      {!isMinimal && (
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-sidebar">
          <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
            <div className="h-12 w-48 rounded-xl overflow-hidden flex items-center justify-center pointer-events-none">
              <img src="/PayTracker-Logo.png" alt="Pay Tracker Logo" className="h-32 w-auto object-contain" />
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {nav.map((item) => {
              const active = isNavActive(pathname, item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${active
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{t(item.labelKey)}</span>
                  </div>
                  {item.isPremium && user?.plan === "FREE" && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${active
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-primary/10 text-primary border-primary/20"
                      }`}>
                      PRO
                    </span>
                  )}
                </Link>
              );
            })}
            {user?.role === "ADMIN" && (
              <Link
                to="/admin/dashboard"
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${pathname.startsWith("/admin")
                  ? "bg-destructive text-destructive-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  }`}
              >
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">{t('shell_admin_panel')}</span>
              </Link>
            )}
          </nav>

          <div className="m-3 rounded-2xl border border-border p-4 bg-card shadow-card">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              {t('shell_live_payments')}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
              {t('shell_live_payments_desc')}
            </p>
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header variant={isMinimal ? "minimal" : "app"} />

        <main
          className={`flex-1 p-4 animate-fade-in lg:p-8 ${isMinimal ? "pb-8" : "pb-[calc(5.75rem+env(safe-area-inset-bottom,0))] lg:pb-8"
            }`}
        >
          {children}
          {!isMinimal && !hideFooter && <Footer />}
        </main>

        {!isMinimal && (
          <nav
            className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-border grid grid-cols-6 px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
            aria-label="Primary"
          >
            {nav.filter(item => !item.isPremium).map((item) => {
              const active = isNavActive(pathname, item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all duration-300 min-h-13 ${active
                    ? "text-primary bg-primary/5 font-semibold"
                    : "text-muted-foreground hover:bg-accent/50"
                    }`}
                >
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 ${active ? "scale-110" : ""}`} />
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-tight leading-tight text-center px-0.5 line-clamp-2 wrap-break-word max-w-full">
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
