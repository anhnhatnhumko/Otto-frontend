import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CONFIRM_DIALOG_CONTENT } from "@/app/admin/dashboard/constants";
import { isDestructiveAction } from "@/app/admin/dashboard/utils";
import type { ConfirmAction } from "@/app/admin/dashboard/types";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ConfirmAction | null;
  onConfirm: () => void;
}

export function ConfirmDialog({ open, onOpenChange, action, onConfirm }: ConfirmDialogProps) {
  const content = action
    ? CONFIRM_DIALOG_CONTENT[action.action] ?? { title: "Xác nhận", description: "Bạn có chắc muốn thực hiện hành động này?" }
    : { title: "", description: "" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            variant={isDestructiveAction(action?.action) ? "destructive" : "default"}
            onClick={onConfirm}
          >
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
