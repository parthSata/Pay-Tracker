import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { useAuth } from "../auth";

export type NotifType = "success" | "warning" | "info" | "error";

export interface Notif {
  id: string;
  _id?: string;
  title: string;
  description: string;
  time: string;
  createdAt?: string;
  type: NotifType;
  unread: boolean;
  category: "payment" | "viewed" | "overdue" | "report" | "product" | "invoice";
}

interface NotificationSettings {
  paymentReceived: boolean;
  invoiceViewed: boolean;
  overdueAlerts: boolean;
  cashflowReport: boolean;
  productUpdates: boolean;
}

interface NotificationContextType {
  notifs: Notif[];
  settings: NotificationSettings;
  unreadCount: number;
  markAllRead: () => void;
  markAsRead: (id: string) => void;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  addNotif: (notif: Omit<Notif, "id" | "unread" | "time">) => void;
  refreshNotifs: () => void;
}

const defaultSettings: NotificationSettings = {
  paymentReceived: true,
  invoiceViewed: true,
  overdueAlerts: true,
  cashflowReport: true,
  productUpdates: false,
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem("pay_tracker_notif_settings");
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const fetchNotifs = async () => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem("pay_tracker_token");
    if (!token) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const raw = response.data?.data;
      const mappedNotifs = Array.isArray(raw)
        ? raw.map((n: any) => ({
            ...n,
            id: n._id,
            time: new Date(n.createdAt).toLocaleDateString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          }))
        : [];

      setNotifs(mappedNotifs);
    } catch {
      // Silent: optional endpoint or network; avoid console noise in dev
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem("pay_tracker_notif_settings", JSON.stringify(settings));
  }, [settings]);

  const filteredNotifs = notifs.filter((n) => {
    if (n.category === "payment") return settings.paymentReceived;
    if (n.category === "viewed") return settings.invoiceViewed;
    if (n.category === "overdue") return settings.overdueAlerts;
    if (n.category === "report") return settings.cashflowReport;
    if (n.category === "product") return settings.productUpdates;
    return true;
  });

  const unreadCount = filteredNotifs.filter((n) => n.unread).length;

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem("pay_tracker_token");
      await axios.patch(`${import.meta.env.VITE_API_URL}/notifications/mark-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
    } catch (error) {
      console.error("Failed to mark all read");
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("pay_tracker_token");
      await axios.patch(`${import.meta.env.VITE_API_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    } catch (error) {
      console.error("Failed to mark as read");
    }
  };

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const addNotif = (notif: Omit<Notif, "id" | "unread" | "time">) => {
    // Local add only for UI feedback
    const newNotif: Notif = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      unread: true,
      time: "Just now",
    };
    setNotifs((prev) => [newNotif, ...prev]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifs: filteredNotifs,
        settings,
        unreadCount,
        markAllRead,
        markAsRead,
        updateSettings,
        addNotif,
        refreshNotifs: fetchNotifs
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
