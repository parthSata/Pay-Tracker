import { CheckCircle2, Clock, Mail, Eye, AlertTriangle, MessageSquare, Plus } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: "created" | "reminder" | "opened" | "pending" | "escalation" | "responded" | "paid";
  date: string;
  title: string;
  desc?: string;
}

interface InvoiceTimelineProps {
  events: TimelineEvent[];
}

export function InvoiceTimeline({ events }: InvoiceTimelineProps) {

  const getIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "created":
        return <Plus className="h-4 w-4" />;
      case "reminder":
        return <Mail className="h-4 w-4" />;
      case "opened":
        return <Eye className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "escalation":
        return <AlertTriangle className="h-4 w-4" />;
      case "responded":
        return <MessageSquare className="h-4 w-4" />;
      case "paid":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getColor = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "created":
        return "bg-primary-soft text-primary";
      case "reminder":
        return "bg-blue-500/10 text-blue-500";
      case "opened":
        return "bg-purple-500/10 text-purple-500";
      case "pending":
        return "bg-warning-soft text-warning";
      case "escalation":
        return "bg-destructive-soft text-destructive";
      case "responded":
        return "bg-success-soft text-success";
      case "paid":
        return "bg-success-soft text-success";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border shadow-card p-6 mt-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        Payment Follow-Up Timeline
      </h3>

      <div className="relative pl-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border/60">
        {events.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No events tracked yet.
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="relative mb-6 last:mb-0">
              <div className={`absolute -left-[31px] top-0.5 h-6 w-6 rounded-full flex items-center justify-center border-4 border-card ${getColor(event.type)}`}>
                {getIcon(event.type)}
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold">{event.title}</div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                {event.desc && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {event.desc}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
