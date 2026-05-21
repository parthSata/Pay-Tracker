import { Calendar, AlertTriangle, Clock } from "lucide-react";
import { CountUp } from "@/components/shared/CountUp";
import { formatINR } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface CashPositionMetricCardProps {
  tabId: "today" | "overdue" | "week";
  activeTab: "today" | "overdue" | "week";
  onClick: () => void;
  label: string;
  amount: number;
  invoiceCount: number;
  iconType: "calendar" | "warning" | "clock";
}

export function CashPositionMetricCard({
  tabId,
  activeTab,
  onClick,
  label,
  amount,
  invoiceCount,
  iconType,
}: CashPositionMetricCardProps) {
  const { t } = useTranslation();
  const isActive = activeTab === tabId;

  const renderIcon = () => {
    switch (iconType) {
      case "calendar":
        return <Calendar className="h-3.5 w-3.5" />;
      case "warning":
        return <AlertTriangle className="h-3.5 w-3.5" />;
      case "clock":
        return <Clock className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  const getThemeClasses = () => {
    switch (tabId) {
      case "today":
        return {
          bg: isActive ? "bg-primary text-primary-foreground shadow-md" : "bg-primary-soft text-primary group-hover:scale-110",
          indicator: "bg-primary",
        };
      case "overdue":
        return {
          bg: isActive ? "bg-destructive text-destructive-foreground shadow-md" : "bg-destructive-soft text-destructive group-hover:scale-110",
          indicator: "bg-destructive",
        };
      case "week":
        return {
          bg: isActive ? "bg-warning text-warning-foreground shadow-md" : "bg-warning-soft text-warning-foreground group-hover:scale-110",
          indicator: "bg-warning",
        };
      default:
        return { bg: "", indicator: "" };
    }
  };

  const theme = getThemeClasses();

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start p-5 text-left transition-all duration-300 border-b md:border-b-0 md:border-r border-border last:border-r-0 hover:bg-muted/30 focus:outline-hidden relative group w-full ${
        isActive ? "bg-muted/50" : ""
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${theme.bg}`}>
          {renderIcon()}
        </div>
      </div>
      <span className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
        <CountUp to={amount} format={(n) => formatINR(Math.round(n))} />
      </span>
      <span className="mt-1 text-xs text-muted-foreground">
        {invoiceCount} {t("nav_invoices").toLowerCase()}
      </span>
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className={`absolute bottom-0 left-0 right-0 h-1 ${theme.indicator}`}
        />
      )}
    </button>
  );
}
