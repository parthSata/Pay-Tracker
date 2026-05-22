import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Search,
  Bell,
  Settings,
  Sparkles,
  CreditCard,
  User,
  LogOut,
  Lock,
  Palette,
  Globe,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
}: {
  children: ReactNode;
  variant?: AppShellVariant;
}) {
  const {
    t,
    pathname,
    user,
    navigate,
    unreadCount,
    markAsRead,
    isMinimal,
    handleLogout,
    handleMarkAllRead,
    decoratedNotifs,
  } = useAppShell({ variant });

  return (
    <div className="min-h-dvh flex w-full bg-background gradient-mesh">
      {!isMinimal && (
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-sidebar">
          <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
            <div className="h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center shadow-glow border border-border bg-white">
              <img src="/PayTracker-Logo.png" alt="Pay Tracker Logo" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">{t('shell_app_name')}</span>
              <span className="text-[11px] text-muted-foreground">{t('shell_app_subtitle')}</span>
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
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                      active 
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
        <header
          className={`h-16 sticky top-0 z-30 glass border-b border-border flex items-center justify-between px-4 lg:px-8 ${isMinimal ? "shrink-0" : ""
            }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="lg:hidden h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center border border-border bg-white shrink-0">
              <img src="/PayTracker-Logo.png" alt="Pay Tracker Logo" className="h-full w-full object-cover" />
            </div>
            {isMinimal ? (
              <span className="text-sm font-semibold tracking-tight truncate">{t('shell_app_name')}</span>
            ) : (
              <div className="hidden md:flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 w-80 max-w-[min(20rem,calc(100vw-12rem))] shadow-card">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  placeholder={t('shell_search_placeholder')}
                  className="bg-transparent outline-none text-sm flex-1 min-w-0 placeholder:text-muted-foreground"
                />
                <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">
                  ⌘K
                </kbd>
              </div>
            )}
          </div>

          {isMinimal ? (
            <Link
              to="/login"
              className="text-sm font-medium text-primary hover:underline shrink-0"
            >
              {t('shell_sign_in')}
            </Link>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="relative h-9 w-9 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-accent transition-colors shadow-card"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow-glow animate-scale-in">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-[min(360px,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] p-0 overflow-hidden rounded-2xl shadow-pop animate-scale-in"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div>
                      <div className="text-sm font-semibold">{t('shell_notifications')}</div>
                      <div className="text-[11px] text-muted-foreground">{unreadCount} {t('shell_unread')}</div>
                    </div>
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {t('shell_mark_all_read')}
                    </button>
                  </div>
                  <div className="max-h-[min(380px,50dvh)] overflow-y-auto">
                    {decoratedNotifs.map((n) => {
                      const Icon = n.Icon;
                      return (
                        <button
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`w-full flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-accent/50 transition-colors text-left ${n.unread ? "bg-primary-soft/30" : ""
                            }`}
                        >
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${n.toneClass}`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{n.title}</span>
                              {n.unread && (
                                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {n.description}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                              {n.time}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="px-4 py-3 border-t border-border bg-muted/30">
                    <Link to="/settings" className="text-xs font-medium text-primary hover:underline">
                      {t('shell_notification_settings')}
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>

              <Link
                to="/settings"
                className="hidden lg:flex h-9 w-9 rounded-xl border border-border bg-card items-center justify-center hover:bg-accent transition-colors shadow-card"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>

              {/* Mobile Settings Dropdown */}
              <div className="lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="h-9 w-9 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-accent transition-colors shadow-card cursor-pointer"
                      aria-label="Settings Menu"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-pop">
                    <DropdownMenuLabel>Settings Sections</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate({ to: "/settings", search: { tab: "notifications" } })} className="cursor-pointer">
                      <Bell className="h-4 w-4 mr-2 text-muted-foreground" /> Notifications
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/settings", search: { tab: "security" } })} className="cursor-pointer">
                      <Lock className="h-4 w-4 mr-2 text-muted-foreground" /> Security
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/settings", search: { tab: "appearance" } })} className="cursor-pointer">
                      <Palette className="h-4 w-4 mr-2 text-muted-foreground" /> Appearance
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/settings", search: { tab: "regional" } })} className="cursor-pointer">
                      <Globe className="h-4 w-4 mr-2 text-muted-foreground" /> Regional
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/settings", search: { tab: "billing" } })} className="cursor-pointer">
                      <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" /> Billing
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/settings", search: { tab: "gst" } })} className="cursor-pointer">
                      <Shield className="h-4 w-4 mr-2 text-muted-foreground" /> GST Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate({ to: "/settings", search: { tab: "danger" } })} className="text-destructive focus:text-destructive cursor-pointer">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 w-9 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-semibold hover:scale-105 transition-transform uppercase">
                    {user?.email?.substring(0, 2) || "U"}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-pop">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold truncate max-w-[180px]">
                        {user?.email?.split("@")[0]}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-normal truncate max-w-[180px]">
                        {user?.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" /> {t('shell_profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" /> {t('shell_settings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> {t('shell_sign_out')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </header>

        <main
          className={`flex-1 p-4 animate-fade-in lg:p-8 ${isMinimal ? "pb-8" : "pb-[calc(5.75rem+env(safe-area-inset-bottom,0))] lg:pb-8"
            }`}
        >
          {children}
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
