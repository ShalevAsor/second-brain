"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * ConfirmAction Component Props
 */
interface ConfirmActionProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description/message */
  description: string;
  /** Callback when user confirms action */
  onConfirm: () => void;
  /** Callback when user cancels (optional) */
  onCancel?: () => void;
  /** Text for confirm button (default: "Continue") */
  confirmText?: string;
  /** Text for cancel button (default: "Cancel") */
  cancelText?: string;
  /** Variant for confirm button styling */
  variant?: "default" | "destructive";
  /** Disable confirm button (e.g., during loading) */
  loading?: boolean;
}

/**
 * ConfirmAction Component
 *
 * A reusable confirmation dialog wrapper around shadcn's AlertDialog.
 * Provides a simple, consistent interface for confirmation prompts throughout the app.
 *
 * @example
 * ```tsx
 * const [showConfirm, setShowConfirm] = useState(false);
 *
 * <ConfirmAction
 *   open={showConfirm}
 *   onOpenChange={setShowConfirm}
 *   title="Delete Folder?"
 *   description="This will permanently delete the folder and all its contents."
 *   confirmText="Delete"
 *   variant="destructive"
 *   onConfirm={() => deleteFolder()}
 * />
 * ```
 */
export function ConfirmAction({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Continue",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmActionProps) {
  /**
   * Handle confirm action
   * Closes dialog and calls onConfirm callback
   */
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  /**
   * Handle cancel action
   * Closes dialog and optionally calls onCancel callback
   */
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {loading ? "Processing..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
