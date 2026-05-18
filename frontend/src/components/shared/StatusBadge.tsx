type Status = "paid" | "pending" | "overdue" | "draft";

const styles: Record<Status, string> = {
  paid: "bg-success-soft text-success border-success/20",
  pending: "bg-warning/10 text-warning-foreground border-warning/20",
  overdue: "bg-destructive-soft text-destructive border-destructive/20",
  draft: "bg-muted text-muted-foreground border-border",
};

const labels: Record<Status, string> = {
  paid: "Paid",
  pending: "Pending",
  overdue: "Overdue",
  draft: "Draft",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${styles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "paid"
            ? "bg-success"
            : status === "pending"
              ? "bg-warning"
              : status === "overdue"
                ? "bg-destructive animate-pulse"
                : "bg-muted-foreground"
        }`}
      />
      {labels[status]}
    </span>
  );
}
