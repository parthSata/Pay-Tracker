import { useMemo } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "../auth";
import { useNotifications } from "../context/NotificationContext";
import {
  CheckCircle2,
  AlertTriangle,
  Eye,
  FileText,
  Sparkles,
  Bell,
} from "lucide-react";

interface UseAppShellProps {
  variant?: "app" | "minimal";
}

export function useAppShell({ variant = "app" }: UseAppShellProps = {}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notifs, unreadCount, markAllRead, markAsRead } = useNotifications();

  const isMinimal = variant === "minimal";

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
    toast.success("Signed out successfully");
  };

  const handleMarkAllRead = () => {
    markAllRead();
    toast.success("All notifications marked as read");
  };

  const decoratedNotifs = useMemo(() => {
    return notifs.map((n) => {
      const Icon =
        n.category === "payment"
          ? CheckCircle2
          : n.category === "overdue"
          ? AlertTriangle
          : n.category === "viewed"
          ? Eye
          : n.category === "report"
          ? FileText
          : n.category === "product"
          ? Sparkles
          : Bell;

      const toneClass =
        n.type === "success"
          ? "text-success bg-success-soft"
          : n.type === "warning"
          ? "text-destructive bg-destructive-soft"
          : "text-primary bg-primary-soft";

      return {
        ...n,
        Icon,
        toneClass,
      };
    });
  }, [notifs]);

  return {
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
  };
}
