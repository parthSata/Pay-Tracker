import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useDeleteAccount } from "@/hooks/useSettings";
import { Panel } from "./SettingsComponents";

export function DeleteAccountSection() {
  const {
    isDeleting,
    handleDelete
  } = useDeleteAccount();

  return (
    <Panel title="Delete Account" description="Irreversible actions. Proceed with care.">
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive-soft p-4">
          <div>
            <div className="text-sm font-medium text-destructive">Export & delete account</div>
            <div className="text-xs text-destructive/80 mt-1">
              Permanently delete your workspace, invoices and clients.
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" /> {isDeleting ? "Deleting..." : "Delete Account"}
          </Button>
        </div>
      </div>
    </Panel>
  );
}
