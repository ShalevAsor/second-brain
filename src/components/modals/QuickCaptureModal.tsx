"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import { FolderSelector } from "@/components/common/folder-selector";
import { TagInput } from "@/components/common/tag-input";
import { ConfirmAction } from "@/components/common/confirm-action";
import { analyzeContentForOrganization } from "@/actions/aiActions";
import { useCreateNote } from "@/hooks/use-notes";
import { useFolders, useCreateFolder } from "@/hooks/use-folders";
import { toast } from "sonner";
import type { SimpleTag } from "@/types/noteTypes";
import type { ContentAnalysisResult } from "@/services/ai/core/types";
import { formatContentAction } from "@/actions/aiActions";
import { findFolderByPath } from "@/lib/folderHelpers";

type CaptureStep = "capture" | "processing" | "review";
type SavingStep = "formatting" | "saving" | null; // ✅ NEW

export const QuickCaptureModal = () => {
  const router = useRouter();
  const { isOpen, type, onClose } = useModalStore();
  const isModalOpen = isOpen && type === "quickCapture";

  const [step, setStep] = useState<CaptureStep>("capture");
  const [savingStep, setSavingStep] = useState<SavingStep>(null); // ✅ NEW
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [tags, setTags] = useState<SimpleTag[]>([]);
  const [aiSuggestion, setAiSuggestion] =
    useState<ContentAnalysisResult | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const createNoteMutation = useCreateNote();
  const createFolderMutation = useCreateFolder();
  const { data: folders } = useFolders();

  const handleClose = () => {
    setStep("capture");
    setSavingStep(null); // ✅ RESET
    setContent("");
    setTitle("");
    setFolderId(null);
    setTags([]);
    setAiSuggestion(null);
    onClose();
  };

  const handleCancel = () => {
    if (content.trim()) {
      setShowCancelConfirm(true);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    setStep("capture");
    setTitle("");
    setFolderId(null);
    setTags([]);
    setAiSuggestion(null);
  };

  const handleSaveAndOrganize = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    setStep("processing");

    try {
      const result = await analyzeContentForOrganization(content);

      if (!result.success) {
        toast.error(
          result.error || "AI analysis failed. Please fill in manually."
        );
        setStep("review");
        setTitle("Untitled Note");
        setFolderId(null);
        setTags([]);
        setAiSuggestion(null);
        return;
      }

      const analysis = result.data;
      setAiSuggestion(analysis);
      setTitle(analysis.title);

      setTags(
        analysis.tags.map((tagName, index) => ({
          id: `temp-${Date.now()}-${index}`,
          name: tagName,
        }))
      );

      if (analysis.folderPath && folders) {
        const matchedFolder = findFolderByPath(analysis.folderPath, folders);

        if (matchedFolder) {
          console.log(
            `✅ Found existing folder: "${analysis.folderPath}" → ID: ${matchedFolder.id}`
          );
          setFolderId(matchedFolder.id);
        } else {
          console.log(
            `📁 No match for "${analysis.folderPath}", will create new folder`
          );
          setFolderId(null);
        }
      } else {
        setFolderId(null);
      }

      setStep("review");
    } catch (error) {
      console.error("AI analysis error:", error);
      toast.error("Failed to analyze content. Please try again.");
      setStep("capture");
    }
  };

  const handleFinalSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      let finalFolderId = folderId;
      let finalContent = content.trim();

      // ✅ IMPROVED: Show formatting step
      if (content.length <= 10000) {
        try {
          setSavingStep("formatting"); // ✅ SHOW "Formatting..."
          console.log("🎨 Formatting content...");

          const formatResult = await formatContentAction(content);

          if (formatResult.success && formatResult.data.wasFormatted) {
            finalContent = formatResult.data.formattedContent;
            console.log("✅ Content formatted successfully");
          } else if (formatResult.success && formatResult.data.error) {
            console.log("⚠️ Formatting skipped:", formatResult.data.error);
          } else {
            console.warn("⚠️ Formatting failed, using plain text");
            toast.error("Formatting failed, saving as plain text");
          }
        } catch (formatError) {
          console.error("❌ Formatting error:", formatError);
          toast.error("Formatting failed, saving as plain text");
        }
      } else {
        console.log("⚠️ Content too long for formatting:", content.length);
        toast.warning("Content too long for auto-formatting (max 10k chars)");
      }

      // ✅ IMPROVED: Show saving step
      setSavingStep("saving"); // ✅ SHOW "Saving..."

      // Only create folder if AI suggested NEW root-level folder
      if (aiSuggestion?.folderPath && !folderId) {
        if (aiSuggestion.folderPath.includes("/")) {
          console.warn(
            `⚠️ AI suggested nested path "${aiSuggestion.folderPath}", extracting root folder`
          );
          const rootFolderName = aiSuggestion.folderPath.split("/")[0];

          const existingRoot = folders?.find(
            (f) =>
              f.name.toLowerCase() === rootFolderName.toLowerCase() &&
              f.depth === 0
          );

          if (existingRoot) {
            finalFolderId = existingRoot.id;
          } else {
            const folderResult = await createFolderMutation.mutateAsync({
              name: rootFolderName,
              parentId: null,
              color: "GRAY",
            });
            finalFolderId = folderResult.id;
          }
        } else {
          const folderResult = await createFolderMutation.mutateAsync({
            name: aiSuggestion.folderPath,
            parentId: null,
            color: "GRAY",
          });
          finalFolderId = folderResult.id;
        }
      }

      // Save note with formatted content
      const noteResult = await createNoteMutation.mutateAsync({
        title: title.trim(),
        content: finalContent,
        folderId: finalFolderId,
        tags: tags.map((t) => t.name),
        isAutoOrganized: !!aiSuggestion,
      });

      if (noteResult?.id) {
        toast.success("Note captured successfully!");
        handleClose();
        router.push(`/notes/${noteResult.id}`);
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save note");
    } finally {
      setSavingStep(null); // ✅ RESET
    }
  };

  const handleTagAdd = (tag: SimpleTag) => {
    const isDuplicate = tags.some(
      (t) => t.name.toLowerCase() === tag.name.toLowerCase()
    );
    if (!isDuplicate) {
      setTags([...tags, tag]);
    }
  };

  const handleTagRemove = (tagId: string) => {
    setTags(tags.filter((t) => t.id !== tagId));
  };

  // ✅ NEW: Calculate if saving/formatting
  const isSaving = savingStep !== null;
  const isFormattingOrSaving =
    createNoteMutation.isPending || createFolderMutation.isPending || isSaving;

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {/* STEP 1: CAPTURE */}
          {step === "capture" && (
            <>
              <DialogHeader>
                <DialogTitle>⚡ Quick Capture</DialogTitle>
                <DialogDescription>
                  Paste your notes, code, or formulas. AI will organize it for
                  you.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Paste your content here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[300px] font-mono text-sm mt-2"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Works great with code, formulas, recipes, or any text
                    content
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
                  <Sparkles className="w-4 h-4 mr-2" />
                  Organize with AI
                </Button>
              </DialogFooter>
            </>
          )}

          {/* STEP 2: PROCESSING */}
          {step === "processing" && (
            <>
              <DialogHeader>
                <DialogTitle>⚡ Quick Capture</DialogTitle>
                <DialogDescription>
                  AI is analyzing your content...
                </DialogDescription>
              </DialogHeader>

              <div className="py-12 text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">
                  🤖 Extracting topics and suggesting organization...
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
                  Review AI suggestions and make any changes before saving
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {aiSuggestion && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">AI Analysis</p>
                        <p className="text-xs text-muted-foreground">
                          {aiSuggestion.reasoning}
                        </p>
                        {aiSuggestion.confidence && (
                          <p className="text-xs">
                            Confidence:{" "}
                            <span
                              className={
                                aiSuggestion.confidence === "high"
                                  ? "text-green-600 font-medium"
                                  : aiSuggestion.confidence === "medium"
                                  ? "text-yellow-600 font-medium"
                                  : "text-orange-600 font-medium"
                              }
                            >
                              {aiSuggestion.confidence}
                            </span>
                          </p>
                        )}
                        {aiSuggestion.wasTruncated && (
                          <div className="flex items-start gap-2 mt-2 text-xs text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded">
                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>
                              Content was truncated. Consider splitting very
                              long notes.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-2"
                    placeholder="Enter note title..."
                  />
                </div>

                <div>
                  <FolderSelector
                    value={folderId}
                    onChange={setFolderId}
                    label="Folder"
                    placeholder="Select folder..."
                    showNoneOption={true}
                    noneOptionLabel="No folder"
                  />
                  {aiSuggestion?.folderPath &&
                    aiSuggestion.folderPath !== "null" &&
                    !folderId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ✨ AI will create folder: &quot;
                        {aiSuggestion.folderPath}&quot;
                      </p>
                    )}
                </div>

                <div>
                  <Label>Tags</Label>
                  <TagInput
                    selectedTags={tags}
                    onTagAdd={handleTagAdd}
                    onTagRemove={handleTagRemove}
                    placeholder="Add tags..."
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Content Preview</Label>
                  <div className="mt-2 p-3 bg-muted rounded-md text-sm font-mono max-h-[120px] overflow-auto">
                    {content.slice(0, 300)}
                    {content.length > 300 && "..."}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="sm:mr-auto"
                  disabled={isFormattingOrSaving}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isFormattingOrSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFinalSave}
                  disabled={isFormattingOrSaving}
                >
                  {isFormattingOrSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {/* ✅ IMPROVED: Show current step */}
                      {savingStep === "formatting"
                        ? "Formatting..."
                        : "Saving..."}
                    </>
                  ) : (
                    "Save Note"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <ConfirmAction
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        title="Discard Note?"
        description="Your pasted content will be lost. Are you sure you want to cancel?"
        confirmText="Discard"
        cancelText="Keep Editing"
        variant="destructive"
        onConfirm={handleClose}
      />
    </>
  );
};
