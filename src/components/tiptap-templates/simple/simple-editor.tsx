// "use client";

// import * as React from "react";
// // import "@/styles/tiptap.css";
// import { EditorContent, EditorContext, useEditor } from "@tiptap/react";

// // --- Tiptap Core Extensions ---
// import { StarterKit } from "@tiptap/starter-kit";
// import { Image } from "@tiptap/extension-image";
// import { TaskItem, TaskList } from "@tiptap/extension-list";
// import { TextAlign } from "@tiptap/extension-text-align";
// import { Typography } from "@tiptap/extension-typography";
// import { Highlight } from "@tiptap/extension-highlight";
// import { Subscript } from "@tiptap/extension-subscript";
// import { Superscript } from "@tiptap/extension-superscript";
// import { Selection } from "@tiptap/extensions";
// import Mathematics from "@tiptap/extension-mathematics";
// import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";

// // --- UI Primitives ---
// import { Button } from "@/components/tiptap-ui-primitive/button";
// import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
// import {
//   Toolbar,
//   ToolbarGroup,
//   ToolbarSeparator,
// } from "@/components/tiptap-ui-primitive/toolbar";

// // --- Tiptap Node ---
// import { CodeBlockComponent } from "@/components/tiptap-node/code-block-node/code-block-node";
// import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
// import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
// import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
// import "@/components/tiptap-node/code-block-node/code-block-node.scss";
// import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
// import "@/components/tiptap-node/list-node/list-node.scss";
// import "@/components/tiptap-node/image-node/image-node.scss";
// import "@/components/tiptap-node/heading-node/heading-node.scss";
// import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

// // --- Tiptap UI ---
// import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
// import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
// import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
// import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
// import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
// import {
//   ColorHighlightPopover,
//   ColorHighlightPopoverContent,
//   ColorHighlightPopoverButton,
// } from "@/components/tiptap-ui/color-highlight-popover";
// import {
//   LinkPopover,
//   LinkContent,
//   LinkButton,
// } from "@/components/tiptap-ui/link-popover";
// import { MarkButton } from "@/components/tiptap-ui/mark-button";
// import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
// import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";
// import {
//   MathInlineContent,
//   MathInlinePopover,
//   MathInlineButton,
// } from "@/components/tiptap-ui/math-inline-popover";
// import { MathBlockPopover } from "@/components/tiptap-ui/math-block-popover";
// // --- Icons ---
// import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon";
// import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon";
// import { LinkIcon } from "@/components/tiptap-icons/link-icon";

// // --- Hooks ---
// import { useIsMobile } from "@/hooks/use-mobile";
// import { useWindowSize } from "@/hooks/use-window-size";
// import { useCursorVisibility } from "@/hooks/use-cursor-visibility";

// // --- Components ---
// import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle";

// // --- Lib ---
// import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils";

// // --- Code Block & Syntax Highlighting ---
// import { createLowlight, common } from "lowlight";
// import { ReactNodeViewRenderer } from "@tiptap/react";

// // --- Styles ---
// import "@/components/tiptap-templates/simple/simple-editor.scss";

// import content from "@/components/tiptap-templates/simple/data/content.json";

// const MainToolbarContent = ({
//   onHighlighterClick,
//   onLinkClick,
//   onMathClick,
//   isMobile,
// }: {
//   onHighlighterClick: () => void;
//   onLinkClick: () => void;
//   onMathClick: () => void;
//   isMobile: boolean;
// }) => {
//   return (
//     <>
//       <Spacer />

//       <ToolbarGroup>
//         <UndoRedoButton action="undo" />
//         <UndoRedoButton action="redo" />
//       </ToolbarGroup>

//       <ToolbarSeparator />

//       <ToolbarGroup>
//         <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
//         <ListDropdownMenu
//           types={["bulletList", "orderedList", "taskList"]}
//           portal={isMobile}
//         />
//         <BlockquoteButton />
//         <CodeBlockButton />
//         {!isMobile ? (
//           <MathInlinePopover />
//         ) : (
//           <MathInlineButton onClick={onMathClick} />
//         )}
//         <MathBlockPopover />
//       </ToolbarGroup>

//       <ToolbarSeparator />

//       <ToolbarGroup>
//         <MarkButton type="bold" />
//         <MarkButton type="italic" />
//         <MarkButton type="strike" />
//         <MarkButton type="code" />
//         <MarkButton type="underline" />
//         {!isMobile ? (
//           <ColorHighlightPopover />
//         ) : (
//           <ColorHighlightPopoverButton onClick={onHighlighterClick} />
//         )}
//         {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
//       </ToolbarGroup>

//       <ToolbarSeparator />

//       <ToolbarGroup>
//         <MarkButton type="superscript" />
//         <MarkButton type="subscript" />
//       </ToolbarGroup>

//       <ToolbarSeparator />

//       <ToolbarGroup>
//         <TextAlignButton align="left" />
//         <TextAlignButton align="center" />
//         <TextAlignButton align="right" />
//         <TextAlignButton align="justify" />
//       </ToolbarGroup>

//       <ToolbarSeparator />

//       <ToolbarGroup>
//         <ImageUploadButton text="Add" />
//       </ToolbarGroup>

//       <Spacer />

//       {isMobile && <ToolbarSeparator />}

//       <ToolbarGroup>
//         <ThemeToggle />
//       </ToolbarGroup>
//     </>
//   );
// };

// const MobileToolbarContent = ({
//   type,
//   onBack,
// }: {
//   type: "highlighter" | "link" | "math";
//   onBack: () => void;
// }) => (
//   <>
//     <ToolbarGroup>
//       <Button data-style="ghost" onClick={onBack}>
//         <ArrowLeftIcon className="tiptap-button-icon" />
//         {type === "highlighter" ? (
//           <HighlighterIcon className="tiptap-button-icon" />
//         ) : type === "link" ? (
//           <LinkIcon className="tiptap-button-icon" />
//         ) : (
//           <span>$x$</span>
//         )}
//       </Button>
//     </ToolbarGroup>

//     <ToolbarSeparator />

//     {type === "highlighter" ? (
//       <ColorHighlightPopoverContent />
//     ) : type === "link" ? (
//       <LinkContent />
//     ) : (
//       <MathInlineContent mobile={true} />
//     )}
//   </>
// );

// export function SimpleEditor() {
//   const lowlight = createLowlight(common);

//   const isMobile = useIsMobile();
//   const { height } = useWindowSize();
//   const [mobileView, setMobileView] = React.useState<
//     "main" | "highlighter" | "link" | "math"
//   >("main");
//   const toolbarRef = React.useRef<HTMLDivElement>(null);

//   const editor = useEditor({
//     immediatelyRender: false,
//     shouldRerenderOnTransaction: false,
//     editorProps: {
//       attributes: {
//         autocomplete: "off",
//         autocorrect: "off",
//         autocapitalize: "off",
//         "aria-label": "Main content area, start typing to enter text.",
//         class: "simple-editor",
//       },
//     },
//     extensions: [
//       StarterKit.configure({
//         horizontalRule: false,
//         codeBlock: false,
//         link: {
//           openOnClick: false,
//           enableClickSelection: true,
//         },
//       }),
//       CodeBlockLowlight.extend({
//         addNodeView() {
//           return ReactNodeViewRenderer(CodeBlockComponent);
//         },
//       }).configure({
//         lowlight,
//         defaultLanguage: "python",
//       }),
//       Mathematics.configure({
//         inlineOptions: {},
//         blockOptions: {},
//         katexOptions: {
//           throwOnError: false, // Don't crash on invalid LaTeX
//         },
//       }),
//       HorizontalRule,
//       TextAlign.configure({ types: ["heading", "paragraph"] }),
//       TaskList,
//       TaskItem.configure({ nested: true }),
//       Highlight.configure({ multicolor: true }),
//       Image,
//       Typography,
//       Superscript,
//       Subscript,
//       Selection,
//       ImageUploadNode.configure({
//         accept: "image/*",
//         maxSize: MAX_FILE_SIZE,
//         limit: 3,
//         upload: handleImageUpload,
//         onError: (error) => console.error("Upload failed:", error),
//       }),
//     ],
//     content,
//   });

//   const rect = useCursorVisibility({
//     editor,
//     overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
//   });

//   React.useEffect(() => {
//     if (!isMobile && mobileView !== "main") {
//       setMobileView("main");
//     }
//   }, [isMobile, mobileView]);
//   React.useEffect(() => {
//     if (!editor) return;

//     const log = () => {
//       console.log("isActive inlineMath:", editor.isActive("inlineMath"));
//       console.log("selection:", editor.state.selection);
//     };

//     editor.on("selectionUpdate", log);

//     return () => {
//       editor.off("selectionUpdate", log);
//     };
//   }, [editor]);

//   return (
//     <div className="simple-editor-wrapper">
//       <EditorContext.Provider value={{ editor }}>
//         <Toolbar
//           ref={toolbarRef}
//           style={{
//             ...(isMobile
//               ? {
//                   bottom: `calc(100% - ${height - rect.y}px)`,
//                 }
//               : {}),
//           }}
//         >
//           {mobileView === "main" ? (
//             <MainToolbarContent
//               onHighlighterClick={() => setMobileView("highlighter")}
//               onLinkClick={() => setMobileView("link")}
//               onMathClick={() => setMobileView("math")}
//               isMobile={isMobile}
//             />
//           ) : (
//             <MobileToolbarContent
//               type={mobileView}
//               onBack={() => setMobileView("main")}
//             />
//           )}
//         </Toolbar>

//         <div className="tiptap-editor-scope">
//           <EditorContent
//             editor={editor}
//             role="presentation"
//             className="simple-editor-content"
//           />
//         </div>
//       </EditorContext.Provider>
//     </div>
//   );
// }
"use client";

import * as React from "react";
// import "@/styles/tiptap.css";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Selection } from "@tiptap/extensions";
import Mathematics from "@tiptap/extension-mathematics";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Placeholder } from "@tiptap/extensions";
// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button";
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";

// --- Tiptap Node ---
import { CodeBlockComponent } from "@/components/tiptap-node/code-block-node/code-block-node";
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover";
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";
import {
  MathInlineContent,
  MathInlinePopover,
  MathInlineButton,
} from "@/components/tiptap-ui/math-inline-popover";
import { MathBlockPopover } from "@/components/tiptap-ui/math-block-popover";
// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap-icons/link-icon";

// --- Hooks ---
import { useIsMobile } from "@/hooks/use-mobile";
import { useWindowSize } from "@/hooks/use-window-size";
import { useCursorVisibility } from "@/hooks/use-cursor-visibility";

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle";

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils";

// --- Code Block & Syntax Highlighting ---
import { createLowlight, common } from "lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";

// --- Constants ---
import { EDITOR_TIPS } from "@/constants/editor-constants";

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss";

interface SimpleEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  editable?: boolean;
  placeholder?: string;
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  onMathClick,
  isMobile,
}: {
  onHighlighterClick: () => void;
  onLinkClick: () => void;
  onMathClick: () => void;
  isMobile: boolean;
}) => {
  return (
    <>
      <Spacer />

      {/* CRITICAL - Always visible */}
      <ToolbarGroup data-priority="critical">
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* HIGH (core) - Always visible */}
      <ToolbarGroup data-priority="high">
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          portal={isMobile}
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* HIGH-3 - Hide at 520px and less */}
      <ToolbarGroup data-priority="high-3">
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* HIGH-2 - Hide at 600px and less */}
      <ToolbarGroup data-priority="high-2">
        {!isMobile ? (
          <MathInlinePopover />
        ) : (
          <MathInlineButton onClick={onMathClick} />
        )}
        <MathBlockPopover />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* HIGH (core) - Always visible */}
      <ToolbarGroup data-priority="high">
        <MarkButton type="bold" />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* HIGH-5 - Hide at 360px and less (smallest phones) */}
      <ToolbarGroup data-priority="high-5">
        <MarkButton type="italic" />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* HIGH-4 - Hide at 410px and less */}
      <ToolbarGroup data-priority="high-4">
        <MarkButton type="strike" />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* HIGH-1 - Hide at 700px and less */}
      <ToolbarGroup data-priority="high-1">
        <MarkButton type="code" />
        <MarkButton type="underline" />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* HIGH-1 - Hide at 700px and less */}
      <ToolbarGroup data-priority="high-1">
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* MEDIUM - Hide at 810px and less */}
      <ToolbarGroup data-priority="medium">
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* LOW - Hide at 1020px and less */}
      <ToolbarGroup data-priority="low">
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* LOW - Hide at 1020px and less */}
      <ToolbarGroup data-priority="low">
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* CRITICAL - Always visible */}
      <ToolbarGroup data-priority="critical">
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      {/* CRITICAL - Always visible */}
      <ToolbarGroup data-priority="critical">
        <ThemeToggle />
      </ToolbarGroup>
    </>
  );
};

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link" | "math";
  onBack: () => void;
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : type === "link" ? (
          <LinkIcon className="tiptap-button-icon" />
        ) : (
          <span>$x$</span>
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : type === "link" ? (
      <LinkContent />
    ) : (
      <MathInlineContent mobile={true} />
    )}
  </>
);

export function SimpleEditor({
  content = "", // Default empty if not provided
  onChange,
  editable = true,
  placeholder = EDITOR_TIPS,
}: SimpleEditorProps) {
  const lowlight = createLowlight(common);

  const isMobile = useIsMobile();
  const { height } = useWindowSize();
  const [mobileView, setMobileView] = React.useState<
    "main" | "highlighter" | "link" | "math"
  >("main");
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editable,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": placeholder,
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        codeBlock: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent);
        },
      }).configure({
        lowlight,
        defaultLanguage: "python",
      }),
      Mathematics.configure({
        inlineOptions: {},
        blockOptions: {},
        katexOptions: {
          throwOnError: false, // Don't crash on invalid LaTeX
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });

  React.useEffect(() => {
    if (!editor || editor.getHTML() === content) return;

    editor.commands.setContent(content, { emitUpdate: false });
  }, [editor, content]);

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              onMathClick={() => setMobileView("math")}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <div className="tiptap-editor-scope">
          <EditorContent
            editor={editor}
            role="presentation"
            className="simple-editor-content"
          />
        </div>
      </EditorContext.Provider>
    </div>
  );
}
