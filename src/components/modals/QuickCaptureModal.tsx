// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { useModalStore } from "@/stores/modalStore";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Loader2, ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
// import { FolderSelector } from "@/components/common/folder-selector";
// import { TagInput } from "@/components/common/tag-input";
// import { analyzeContentForOrganization } from "@/actions/aiActions";
// import { useCreateNote } from "@/hooks/use-notes";
// import { useFolders, useCreateFolder } from "@/hooks/use-folders";
// import { toast } from "sonner";
// import type { SimpleTag } from "@/types/noteTypes";
// import type { ContentAnalysisResult } from "@/lib/ai/types";

// /**
//  * Modal Steps
//  */
// type CaptureStep = "capture" | "processing" | "review";

// /**
//  * QuickCaptureModal - AI-powered note capture
//  *
//  * Flow:
//  * 1. User pastes content
//  * 2. AI analyzes and suggests organization
//  * 3. User reviews and edits suggestions
//  * 4. Save note (with folder auto-creation if needed)
//  */
// export const QuickCaptureModal = () => {
//   const router = useRouter();
//   const { isOpen, type, onClose } = useModalStore();
//   const isModalOpen = isOpen && type === "quickCapture";

//   // Step management
//   const [step, setStep] = useState<CaptureStep>("capture");

//   // Form state
//   const [content, setContent] = useState("");
//   const [title, setTitle] = useState("");
//   const [folderId, setFolderId] = useState<string | null>(null);
//   const [tags, setTags] = useState<SimpleTag[]>([]);
//   const [aiSuggestion, setAiSuggestion] =
//     useState<ContentAnalysisResult | null>(null);

//   // Hooks
//   const createNoteMutation = useCreateNote();
//   const createFolderMutation = useCreateFolder();
//   const { data: folders } = useFolders();

//   /**
//    * Reset modal state when closed
//    */
//   const handleClose = () => {
//     setStep("capture");
//     setContent("");
//     setTitle("");
//     setFolderId(null);
//     setTags([]);
//     setAiSuggestion(null);
//     onClose();
//   };

//   /**
//    * Handle cancel with confirmation if user has made changes
//    */
//   const handleCancel = () => {
//     if (step === "review" && content.trim()) {
//       if (confirm("Discard this note? Your content will be lost.")) {
//         handleClose();
//       }
//     } else {
//       handleClose();
//     }
//   };

//   /**
//    * Handle back button (from review to capture)
//    */
//   const handleBack = () => {
//     setStep("capture");
//     setTitle("");
//     setFolderId(null);
//     setTags([]);
//     setAiSuggestion(null);
//   };

//   /**
//    * Handle AI analysis (Step 1 → Step 2 → Step 3)
//    */
//   const handleSaveAndOrganize = async () => {
//     if (!content.trim()) {
//       toast.error("Please enter some content");
//       return;
//     }

//     setStep("processing");

//     try {
//       // Call AI server action
//       const result = await analyzeContentForOrganization(content);

//       if (!result.success) {
//         // AI failed - fallback to manual entry
//         toast.error(
//           result.error || "AI analysis failed. Please fill in manually."
//         );
//         setStep("review");
//         setTitle("Untitled Note");
//         setFolderId(null);
//         setTags([]);
//         setAiSuggestion(null);
//         return;
//       }

//       // AI succeeded - populate review step with suggestions
//       const analysis = result.data;
//       setAiSuggestion(analysis);
//       setTitle(analysis.title);

//       // Convert AI tag suggestions to SimpleTag format
//       setTags(
//         analysis.tags.map((tagName, index) => ({
//           id: `temp-${Date.now()}-${index}`, // Temporary ID
//           name: tagName,
//         }))
//       );

//       // Handle folder suggestion
//       if (analysis.folderPath) {
//         // Check if suggested folder exists (case-insensitive match)
//         const existingFolder = folders?.find(
//           (f) => f.name.toLowerCase() === analysis.folderPath?.toLowerCase()
//         );

//         if (existingFolder) {
//           // Use existing folder
//           setFolderId(existingFolder.id);
//         } else {
//           // Will create new folder on save
//           setFolderId(null);
//         }
//       } else {
//         setFolderId(null);
//       }

//       setStep("review");
//     } catch (error) {
//       console.error("AI analysis error:", error);
//       toast.error("Failed to analyze content. Please try again.");
//       setStep("capture");
//     }
//   };

//   /**
//    * Handle final save (Step 3 → Complete)
//    * Creates folder if needed, then creates note
//    */
//   const handleFinalSave = async () => {
//     if (!title.trim()) {
//       toast.error("Please enter a title");
//       return;
//     }

//     try {
//       let finalFolderId = folderId;

//       // Create folder if AI suggested one and it doesn't exist
//       if (aiSuggestion?.folderPath && !folderId) {
//         const folderResult = await createFolderMutation.mutateAsync({
//           name: aiSuggestion.folderPath,
//           parentId: null,
//           color: "GRAY",
//         });

//         finalFolderId = folderResult.id;
//         // Toast already shown by useCreateFolder hook
//       }

//       // Create note with tags
//       const noteResult = await createNoteMutation.mutateAsync({
//         title: title.trim(),
//         content: content.trim(),
//         folderId: finalFolderId,
//         tags: tags.map((t) => t.name), // Extract tag names
//         isAutoOrganized: !!aiSuggestion, // Mark if AI was used
//       });
//       toast.success("Note captured successfully!");
//       handleClose();

//       // Navigate to the new note
//       if (noteResult?.id) {
//         router.push(`/notes/${noteResult.id}`);
//       }
//     } catch (error) {
//       console.error("Save error:", error);
//       toast.error("Failed to save note. Please try again.");
//     }
//   };

//   /**
//    * Handle tag add (prevents duplicates)
//    */
//   const handleTagAdd = (tag: SimpleTag) => {
//     // Check for duplicates (case-insensitive)
//     const isDuplicate = tags.some(
//       (t) => t.name.toLowerCase() === tag.name.toLowerCase()
//     );
//     if (!isDuplicate) {
//       setTags([...tags, tag]);
//     }
//   };

//   /**
//    * Handle tag remove
//    */
//   const handleTagRemove = (tagId: string) => {
//     setTags(tags.filter((t) => t.id !== tagId));
//   };

//   return (
//     <Dialog open={isModalOpen} onOpenChange={handleClose}>
//       <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
//         {/* STEP 1: CAPTURE */}
//         {step === "capture" && (
//           <>
//             <DialogHeader>
//               <DialogTitle>⚡ Quick Capture</DialogTitle>
//               <DialogDescription>
//                 Paste your notes, code, or formulas. AI will organize it for
//                 you.
//               </DialogDescription>
//             </DialogHeader>

//             <div className="space-y-4 py-4">
//               {/* Textarea for content */}
//               <div>
//                 <Label htmlFor="content">Content</Label>
//                 <Textarea
//                   id="content"
//                   placeholder="Paste your content here..."
//                   value={content}
//                   onChange={(e) => setContent(e.target.value)}
//                   className="min-h-[300px] font-mono text-sm mt-2"
//                   autoFocus
//                 />
//                 <p className="text-xs text-muted-foreground mt-2">
//                   💡 Works great with code, formulas, recipes, or any text
//                   content
//                 </p>
//               </div>
//             </div>

//             <DialogFooter>
//               <Button variant="outline" onClick={handleCancel}>
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleSaveAndOrganize}
//                 disabled={!content.trim()}
//               >
//                 <Sparkles className="w-4 h-4 mr-2" />
//                 Organize with AI
//               </Button>
//             </DialogFooter>
//           </>
//         )}

//         {/* STEP 2: PROCESSING */}
//         {step === "processing" && (
//           <>
//             <DialogHeader>
//               <DialogTitle>⚡ Quick Capture</DialogTitle>
//               <DialogDescription>
//                 AI is analyzing your content...
//               </DialogDescription>
//             </DialogHeader>

//             <div className="py-12 text-center">
//               <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
//               <p className="mt-4 text-sm text-muted-foreground">
//                 🤖 Extracting topics and suggesting organization...
//               </p>
//             </div>
//           </>
//         )}

//         {/* STEP 3: REVIEW */}
//         {step === "review" && (
//           <>
//             <DialogHeader>
//               <DialogTitle>⚡ Quick Capture - Review & Save</DialogTitle>
//               <DialogDescription>
//                 Review AI suggestions and make any changes before saving
//               </DialogDescription>
//             </DialogHeader>

//             <div className="space-y-4 py-4">
//               {/* AI Reasoning (if available) */}
//               {aiSuggestion && (
//                 <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
//                   <div className="flex items-start gap-2">
//                     <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
//                     <div className="flex-1 space-y-1">
//                       <p className="text-sm font-medium">AI Analysis</p>
//                       <p className="text-xs text-muted-foreground">
//                         {aiSuggestion.reasoning}
//                       </p>
//                       {aiSuggestion.confidence && (
//                         <p className="text-xs">
//                           Confidence:{" "}
//                           <span
//                             className={
//                               aiSuggestion.confidence === "high"
//                                 ? "text-green-600 font-medium"
//                                 : aiSuggestion.confidence === "medium"
//                                 ? "text-yellow-600 font-medium"
//                                 : "text-orange-600 font-medium"
//                             }
//                           >
//                             {aiSuggestion.confidence}
//                           </span>
//                         </p>
//                       )}
//                       {aiSuggestion.wasTruncated && (
//                         <div className="flex items-start gap-2 mt-2 text-xs text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded">
//                           <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
//                           <span>
//                             Content was truncated. Consider splitting very long
//                             notes.
//                           </span>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Title (editable) */}
//               <div>
//                 <Label htmlFor="title">Title</Label>
//                 <Input
//                   id="title"
//                   type="text"
//                   value={title}
//                   onChange={(e) => setTitle(e.target.value)}
//                   className="mt-2"
//                   placeholder="Enter note title..."
//                 />
//               </div>

//               {/* Folder Selector */}
//               <div>
//                 <FolderSelector
//                   value={folderId}
//                   onChange={setFolderId}
//                   label="Folder"
//                   placeholder="Select folder..."
//                   showNoneOption={true}
//                   noneOptionLabel="No folder"
//                 />
//                 {/* ✅ FIX: Only show message for valid folder names */}
//                 {aiSuggestion?.folderPath &&
//                   aiSuggestion.folderPath !== "null" &&
//                   !folderId && (
//                     <p className="text-xs text-muted-foreground mt-1">
//                       ✨ AI will create folder: &quot;{aiSuggestion.folderPath}
//                       &quot;
//                     </p>
//                   )}
//               </div>

//               {/* Tag Input */}
//               <div>
//                 <Label>Tags</Label>
//                 <TagInput
//                   selectedTags={tags}
//                   onTagAdd={handleTagAdd}
//                   onTagRemove={handleTagRemove}
//                   placeholder="Add tags..."
//                   className="mt-2"
//                 />
//               </div>

//               {/* Content Preview */}
//               <div>
//                 <Label>Content Preview</Label>
//                 <div className="mt-2 p-3 bg-muted rounded-md text-sm font-mono max-h-[120px] overflow-auto">
//                   {content.slice(0, 300)}
//                   {content.length > 300 && "..."}
//                 </div>
//               </div>
//             </div>

//             <DialogFooter className="gap-2 sm:gap-0">
//               <Button
//                 variant="outline"
//                 onClick={handleBack}
//                 className="sm:mr-auto"
//               >
//                 <ArrowLeft className="h-4 w-4 mr-2" />
//                 Back
//               </Button>
//               <Button variant="outline" onClick={handleCancel}>
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleFinalSave}
//                 disabled={
//                   createNoteMutation.isPending || createFolderMutation.isPending
//                 }
//               >
//                 {createNoteMutation.isPending ||
//                 createFolderMutation.isPending ? (
//                   <>
//                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                     Saving...
//                   </>
//                 ) : (
//                   "Save Note"
//                 )}
//               </Button>
//             </DialogFooter>
//           </>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// };
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
import { ConfirmAction } from "@/components/common/confirm-action"; // ✅ Import
import { analyzeContentForOrganization } from "@/actions/aiActions";
import { useCreateNote } from "@/hooks/use-notes";
import { useFolders, useCreateFolder } from "@/hooks/use-folders";
import { toast } from "sonner";
import type { SimpleTag } from "@/types/noteTypes";
import type { ContentAnalysisResult } from "@/lib/ai/types";

type CaptureStep = "capture" | "processing" | "review";

export const QuickCaptureModal = () => {
  const router = useRouter();
  const { isOpen, type, onClose } = useModalStore();
  const isModalOpen = isOpen && type === "quickCapture";

  const [step, setStep] = useState<CaptureStep>("capture");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [tags, setTags] = useState<SimpleTag[]>([]);
  const [aiSuggestion, setAiSuggestion] =
    useState<ContentAnalysisResult | null>(null);

  // ✅ NEW: Confirmation dialog state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const createNoteMutation = useCreateNote();
  const createFolderMutation = useCreateFolder();
  const { data: folders } = useFolders();

  const handleClose = () => {
    setStep("capture");
    setContent("");
    setTitle("");
    setFolderId(null);
    setTags([]);
    setAiSuggestion(null);
    onClose();
  };

  // ✅ FIXED: Better cancel handling with confirmation
  const handleCancel = () => {
    // Show confirmation if there's content
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

      if (analysis.folderPath) {
        const existingFolder = folders?.find(
          (f) => f.name.toLowerCase() === analysis.folderPath?.toLowerCase()
        );

        if (existingFolder) {
          setFolderId(existingFolder.id);
        } else {
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

      if (aiSuggestion?.folderPath && !folderId) {
        const folderResult = await createFolderMutation.mutateAsync({
          name: aiSuggestion.folderPath,
          parentId: null,
          color: "GRAY",
        });

        finalFolderId = folderResult.id;
      }

      const noteResult = await createNoteMutation.mutateAsync({
        title: title.trim(),
        content: content.trim(),
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
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  onClick={handleFinalSave}
                  disabled={
                    createNoteMutation.isPending ||
                    createFolderMutation.isPending
                  }
                >
                  {createNoteMutation.isPending ||
                  createFolderMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
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

      {/* ✅ NEW: Cancel Confirmation Dialog */}
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
