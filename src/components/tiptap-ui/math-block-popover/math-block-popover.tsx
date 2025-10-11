"use client";

import * as React from "react";
import type { Editor } from "@tiptap/react";
import katex from "katex";

// --- Hooks ---
import { useIsMobile } from "@/hooks/use-mobile";
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// --- Icons ---
import { CornerDownLeftIcon } from "@/components/tiptap-icons/corner-down-left-icon";
import { TrashIcon } from "@/components/tiptap-icons/trash-icon";

// --- Tiptap UI ---
import type { UseMathBlockPopoverConfig } from "@/components/tiptap-ui/math-block-popover";
import { useMathBlockPopover } from "@/components/tiptap-ui/math-block-popover";

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button, ButtonGroup } from "@/components/tiptap-ui-primitive/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/tiptap-ui-primitive/popover";
import {
  Card,
  CardBody,
  CardItemGroup,
} from "@/components/tiptap-ui-primitive/card";
import { InputGroup } from "@/components/tiptap-ui-primitive/input";

// --- Lib ---
import { BLOCK_QUICK_INSERTS } from "@/constants/math-quick-inserts";

// --- Styles ---
import "@/components/tiptap-ui/math-block-popover/math-block-popover.scss";

export interface MathBlockMainProps {
  latex: string;
  setLatex: React.Dispatch<React.SetStateAction<string>>;
  insertMath: () => void;
  deleteMath: () => void;
  isActive: boolean;
}

export interface MathBlockPopoverProps
  extends Omit<ButtonProps, "type">,
    UseMathBlockPopoverConfig {
  onOpenChange?: (isOpen: boolean) => void;
  autoOpenOnMathActive?: boolean;
}

/**
 * Block math button component for triggering the block math popover
 */
export const MathBlockButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        type="button"
        className={className}
        data-style="ghost"
        role="button"
        tabIndex={-1}
        aria-label="Insert block formula"
        tooltip="Insert block formula"
        ref={ref}
        {...props}
      >
        {children || "$$"}
      </Button>
    );
  }
);

MathBlockButton.displayName = "MathBlockButton";

/**
 * Main content component for the block math popover
 */
const MathBlockMain: React.FC<MathBlockMainProps> = ({
  latex,
  setLatex,
  insertMath,
  deleteMath,
  isActive,
}) => {
  const isMobile = useIsMobile();
  const [showHelp, setShowHelp] = React.useState(false);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Allow Shift+Enter for new lines, Enter alone to insert
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      insertMath();
    }
  };

  const insertQuickFormula = (formula: string) => {
    // For block math, append with newline if there's existing content
    const separator = latex && !latex.endsWith("\n") ? "\n " : " ";
    setLatex(latex + separator + formula);
  };

  // Show preview even with partial errors (KaTeX will render what it can)
  const previewContent = React.useMemo(() => {
    if (!latex) return null;

    try {
      const html = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: true, // BLOCK MODE - centered, larger
      });
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return null;
    }
  }, [latex]);

  const MAX_LATEX_LENGTH = 300; // Increased for block math
  const isOverLimit = latex.length > MAX_LATEX_LENGTH;

  return (
    <Card className={isMobile ? "math-block-popover-card--mobile" : ""}>
      <CardBody className={isMobile ? "math-block-popover-body--mobile" : ""}>
        <CardItemGroup orientation="vertical">
          {/* Textarea field row */}
          <CardItemGroup
            orientation="horizontal"
            className="math-block-popover-input-row"
          >
            <InputGroup className="math-block-popover-input-group">
              <textarea
                style={{
                  /* 🔥 ADD THIS */ width: "100%",
                  maxWidth: "450px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowX: "hidden",
                  boxSizing: "border-box",
                }}
                className="math-block-popover-textarea"
                placeholder="Enter block formula... (e.g., matrices, multi-line equations)
Shift+Enter for new line, Enter to insert"
                value={latex}
                onChange={(e) => setLatex(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                maxLength={MAX_LATEX_LENGTH}
                rows={4}
              />
              {/* Character counter */}
              <div
                className={`math-block-popover-char-counter ${
                  isOverLimit
                    ? "math-block-popover-char-counter--over-limit"
                    : ""
                }`}
              >
                {latex.length}/{MAX_LATEX_LENGTH}
              </div>
            </InputGroup>

            <ButtonGroup
              orientation="vertical"
              className="math-block-popover-button-group"
            >
              <Button
                type="button"
                onClick={insertMath}
                title={isActive ? "Update formula" : "Insert formula"}
                disabled={!latex || isOverLimit}
                data-style="ghost"
              >
                <CornerDownLeftIcon className="tiptap-button-icon" />
              </Button>

              {isActive && (
                <Button
                  type="button"
                  onClick={deleteMath}
                  title="Delete formula"
                  data-style="ghost"
                >
                  <TrashIcon className="tiptap-button-icon" />
                </Button>
              )}
            </ButtonGroup>
          </CardItemGroup>

          {/* Preview area - larger for block math */}
          {latex && previewContent && (
            <div className="math-block-popover-preview">
              <strong className="math-block-popover-preview-label">
                Preview:
              </strong>
              <div className="math-block-popover-preview-content">
                {previewContent}
              </div>
            </div>
          )}

          {/* Quick Insert structures */}
          <div className="math-block-popover-quick-insert">
            <Button
              type="button"
              data-style="ghost"
              onClick={() => setShowHelp(!showHelp)}
              className="math-block-popover-quick-insert-toggle"
            >
              <span>Quick Insert</span>
              <span
                className={`math-block-popover-quick-insert-chevron ${
                  showHelp
                    ? "math-block-popover-quick-insert-chevron--open"
                    : ""
                }`}
              >
                ▼
              </span>
            </Button>

            {showHelp && (
              <div className="math-block-popover-quick-insert-grid">
                {BLOCK_QUICK_INSERTS.map((item) => (
                  <Button
                    key={item.latex}
                    type="button"
                    data-style="ghost"
                    onClick={() => insertQuickFormula(item.latex)}
                    className="math-block-popover-quick-button"
                    title={item.description || item.latex}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardItemGroup>
      </CardBody>
    </Card>
  );
};

/**
 * Mobile content component for the block math popover
 */
const MathBlockMainMobile: React.FC<MathBlockMainProps> = ({
  latex,
  setLatex,
  insertMath,
  deleteMath,
  isActive,
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      insertMath();
    }
  };

  return (
    <CardItemGroup
      orientation="horizontal"
      className="math-block-popover-mobile-row"
    >
      <InputGroup className="math-block-popover-input-group">
        <textarea
          style={{
            /* 🔥 ADD THIS */ width: "100%",
            maxWidth: "450px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowX: "hidden",
            boxSizing: "border-box",
          }}
          className="math-block-popover-textarea"
          placeholder="Block formula (e.g., matrix, equations)"
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          autoComplete="off"
          rows={3}
          wrap="soft"
        />
      </InputGroup>

      <ButtonGroup
        orientation="vertical"
        className="math-block-popover-button-group"
      >
        <Button
          type="button"
          onClick={insertMath}
          disabled={!latex}
          data-style="ghost"
        >
          <CornerDownLeftIcon className="tiptap-button-icon" />
        </Button>

        {isActive && (
          <Button type="button" onClick={deleteMath} data-style="ghost">
            <TrashIcon className="tiptap-button-icon" />
          </Button>
        )}
      </ButtonGroup>
    </CardItemGroup>
  );
};

/**
 * Block math content component for standalone use
 */
export const MathBlockContent: React.FC<{
  editor?: Editor | null;
  mobile?: boolean;
}> = ({ editor, mobile = false }) => {
  const mathBlockPopover = useMathBlockPopover({
    editor,
  });

  return mobile ? (
    <MathBlockMainMobile {...mathBlockPopover} />
  ) : (
    <MathBlockMain {...mathBlockPopover} />
  );
};

/**
 * Block math popover component for Tiptap editors.
 *
 * For custom popover implementations, use the `useMathBlockPopover` hook instead.
 */
export const MathBlockPopover = React.forwardRef<
  HTMLButtonElement,
  MathBlockPopoverProps
>(
  (
    {
      editor: providedEditor,
      hideWhenUnavailable = false,
      onInsertMath,
      onOpenChange,
      autoOpenOnMathActive = false,
      onClick,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor);
    const [isOpen, setIsOpen] = React.useState(false);

    const {
      isVisible,
      canInsert,
      isActive,
      latex,
      setLatex,
      insertMath,
      deleteMath,
    } = useMathBlockPopover({
      editor,
      hideWhenUnavailable,
      onInsertMath,
    });

    const handleOnOpenChange = React.useCallback(
      (nextIsOpen: boolean) => {
        setIsOpen(nextIsOpen);
        onOpenChange?.(nextIsOpen);
      },
      [onOpenChange]
    );

    const handleInsertMath = React.useCallback(() => {
      insertMath();
      setIsOpen(false);
    }, [insertMath]);

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        setIsOpen(!isOpen);
      },
      [onClick, isOpen]
    );

    React.useEffect(() => {
      if (autoOpenOnMathActive && isActive) {
        setIsOpen(true);
      }
    }, [autoOpenOnMathActive, isActive]);

    if (!isVisible) {
      return null;
    }

    return (
      <Popover open={isOpen} onOpenChange={handleOnOpenChange}>
        <PopoverTrigger asChild>
          <MathBlockButton
            disabled={!canInsert}
            data-active-state={isActive ? "on" : "off"}
            data-disabled={!canInsert}
            aria-label="Insert block formula"
            aria-pressed={isActive}
            onClick={handleClick}
            {...buttonProps}
            ref={ref}
          >
            {children ?? "$$"}
          </MathBlockButton>
        </PopoverTrigger>

        <PopoverContent>
          <MathBlockMain
            latex={latex}
            setLatex={setLatex}
            insertMath={handleInsertMath}
            deleteMath={deleteMath}
            isActive={isActive}
          />
        </PopoverContent>
      </Popover>
    );
  }
);

MathBlockPopover.displayName = "MathBlockPopover";

export default MathBlockPopover;
