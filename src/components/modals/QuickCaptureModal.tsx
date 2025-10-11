"use client";

import { useState } from "react";
import { useModalStore } from "@/stores/modalStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Modal Steps
 */
type CaptureStep = "capture" | "processing" | "review";

export const QuickCaptureModal = () => {
  const { isOpen, type, onClose } = useModalStore();
  const isModalOpen = isOpen && type === "quickCapture";

  // Step management
  const [step, setStep] = useState<CaptureStep>("capture");

  // Form state
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  /**
   * Reset modal state when closed
   */
  const handleClose = () => {
    setStep("capture");
    setContent("");
    setTitle("");
    setFolder("");
    setTags([]);
    onClose();
  };

  /**
   * Handle cancel with confirmation
   */
  const handleCancel = () => {
    if (step === "review" && content.trim()) {
      if (confirm("Discard changes?")) {
        handleClose();
      }
    } else {
      handleClose();
    }
  };

  /**
   * Handle back button (from review to capture)
   */
  const handleBack = () => {
    setStep("capture");
  };

  /**
   * Handle save & organize (Step 1 → Step 2)
   */
  const handleSaveAndOrganize = async () => {
    if (!content.trim()) return;

    setStep("processing");

    // TODO: Call AI server action here
    // For now, simulate AI processing
    setTimeout(() => {
      setTitle("Quick Sort Implementation"); // AI suggested
      setFolder("CS 101/Algorithms"); // AI suggested
      setTags(["python", "sorting"]); // AI suggested
      setStep("review");
    }, 2000);
  };

  /**
   * Handle final save (Step 3 → Complete)
   */
  const handleFinalSave = async () => {
    // TODO: Save to database
    console.log("Saving note:", { title, folder, tags, content });

    // Close modal and show toast
    handleClose();
    // TODO: Show toast notification
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        {/* STEP 1: CAPTURE */}
        {step === "capture" && (
          <>
            <DialogHeader>
              <DialogTitle>⚡ Quick Capture</DialogTitle>
              <DialogDescription>
                Paste your notes, code, or formulas. We&lsquoll organize it for
                you.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Textarea for content */}
              <Textarea
                placeholder="Paste your content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />

              {/* File upload placeholder */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Drag & drop files here
                </p>
                <p className="text-xs text-gray-500">
                  PDF, Images (Coming soon)
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveAndOrganize}
                disabled={!content.trim()}
              >
                Save & Organize
              </Button>
            </DialogFooter>
          </>
        )}

        {/* STEP 2: PROCESSING */}
        {step === "processing" && (
          <>
            <DialogHeader>
              <DialogTitle>⚡ Quick Capture</DialogTitle>
              <DialogDescription>Analyzing your content...</DialogDescription>
            </DialogHeader>

            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">
                🤖 Extracting topics and organizing...
              </p>
            </div>
          </>
        )}

        {/* STEP 3: REVIEW */}
        {step === "review" && (
          <>
            <DialogHeader>
              <DialogTitle>⚡ Quick Capture - Review & Save</DialogTitle>
              <DialogDescription>
                Review and edit AI suggestions before saving
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Title (editable) */}
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>

              {/* Folder (will be dropdown) */}
              <div>
                <label className="text-sm font-medium">Folder</label>
                <Input
                  type="text"
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  placeholder="e.g., CS 101/Algorithms"
                />
              </div>

              {/* Tags (will be combobox) */}
              <div>
                <label className="text-sm font-medium">Tags</label>
                <div className="flex gap-2 mt-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="text-sm font-medium">Preview</label>
                <div className="mt-1 p-3 bg-muted rounded-md text-sm font-mono max-h-[100px] overflow-auto">
                  {content.slice(0, 200)}
                  {content.length > 200 && "..."}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleFinalSave}>Save Note</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
