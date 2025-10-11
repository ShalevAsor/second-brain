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
import type { UseMathInlinePopoverConfig } from "@/components/tiptap-ui/math-inline-popover";
import { useMathInlinePopover } from "@/components/tiptap-ui/math-inline-popover";

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button, ButtonGroup } from "@/components/tiptap-ui-primitive/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/tiptap-ui-primitive/popover";
import { Separator } from "@/components/tiptap-ui-primitive/separator";
import {
  Card,
  CardBody,
  CardItemGroup,
} from "@/components/tiptap-ui-primitive/card";
import { Input, InputGroup } from "@/components/tiptap-ui-primitive/input";

// --- Lib ---
import { INLINE_QUICK_INSERTS } from "@/constants/math-quick-inserts";

// --- Styles ---
import "@/components/tiptap-ui/math-inline-popover/math-inline-popover.scss";

export interface MathMainProps {
  latex: string;
  setLatex: React.Dispatch<React.SetStateAction<string>>;
  insertMath: () => void;
  deleteMath: () => void;
  isActive: boolean;
}

export interface MathPopoverProps
  extends Omit<ButtonProps, "type">,
    UseMathInlinePopoverConfig {
  onOpenChange?: (isOpen: boolean) => void;
  autoOpenOnMathActive?: boolean;
}

/**
 * Math button component for triggering the math popover
 */
export const MathInlineButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className, children, ...props }, ref) => {
  return (
    <Button
      type="button"
      className={className}
      data-style="ghost"
      role="button"
      tabIndex={-1}
      aria-label="Insert inline formula"
      tooltip="Insert inline formula"
      ref={ref}
      {...props}
    >
      {children || "$x$"}
    </Button>
  );
});

MathInlineButton.displayName = "MathInlineButton";

/**
 * Main content component for the math popover
 */
const MathMain: React.FC<MathMainProps> = ({
  latex,
  setLatex,
  insertMath,
  deleteMath,
  isActive,
}) => {
  const isMobile = useIsMobile();
  const [showHelp, setShowHelp] = React.useState(false);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      insertMath();
    }
  };

  const insertQuickFormula = (formula: string) => {
    setLatex(latex + formula);
  };

  // Show preview even with partial errors (KaTeX will render what it can)
  const previewContent = React.useMemo(() => {
    if (!latex) return null;

    try {
      const html = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: false,
      });
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return null;
    }
  }, [latex]);

  const MAX_LATEX_LENGTH = 40;
  const isOverLimit = latex.length > MAX_LATEX_LENGTH;

  return (
    <Card className={isMobile ? "math-popover-card--mobile" : ""}>
      <CardBody className={isMobile ? "math-popover-body--mobile" : ""}>
        <CardItemGroup orientation="vertical">
          {/* Input field row with proper alignment */}
          <CardItemGroup
            orientation="horizontal"
            className="math-popover-input-row"
          >
            <InputGroup className="math-popover-input-group">
              <Input
                type="text"
                placeholder="Enter LaTeX formula... (e.g., x^2, \frac{a}{b})"
                value={latex}
                onChange={(e) => setLatex(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                maxLength={MAX_LATEX_LENGTH}
              />
              {/* Character counter */}
              <div
                className={`math-popover-char-counter ${
                  isOverLimit ? "math-popover-char-counter--over-limit" : ""
                }`}
              >
                {latex.length}/{MAX_LATEX_LENGTH}
              </div>
            </InputGroup>

            <ButtonGroup
              orientation="horizontal"
              className="math-popover-button-group"
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
            </ButtonGroup>

            {isActive && (
              <>
                <Separator />
                <ButtonGroup
                  orientation="horizontal"
                  className="math-popover-button-group"
                >
                  <Button
                    type="button"
                    onClick={deleteMath}
                    title="Delete formula"
                    data-style="ghost"
                  >
                    <TrashIcon className="tiptap-button-icon" />
                  </Button>
                </ButtonGroup>
              </>
            )}
          </CardItemGroup>

          {/* Preview area - scrollable horizontally */}
          {latex && previewContent && (
            <div className="math-popover-preview">
              <strong className="math-popover-preview-label">Preview:</strong>
              <div className="math-popover-preview-content">
                {previewContent}
              </div>
            </div>
          )}

          {/* Quick Insert with 2 rows of 6 buttons */}

          <div className="math-popover-quick-insert">
            <Button
              type="button"
              data-style="ghost"
              onClick={() => setShowHelp(!showHelp)}
              className="math-popover-quick-insert-toggle"
            >
              <span>Quick Insert</span>
              <span
                className={`math-popover-quick-insert-chevron ${
                  showHelp ? "math-popover-quick-insert-chevron--open" : ""
                }`}
              >
                ▼
              </span>
            </Button>

            {showHelp && (
              <div className="math-popover-quick-insert-grid">
                {INLINE_QUICK_INSERTS.map((item) => (
                  <Button
                    key={item.latex}
                    type="button"
                    data-style="ghost"
                    onClick={() => insertQuickFormula(item.latex)}
                    className="math-popover-quick-button"
                    title={item.latex}
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
 * Mobile content component for the math popover
 */
const MathMainMobile: React.FC<MathMainProps> = ({
  latex,
  setLatex,
  insertMath,
  deleteMath,
  isActive,
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      insertMath();
    }
  };

  return (
    <CardItemGroup orientation="horizontal" className="math-popover-mobile-row">
      <InputGroup className="math-popover-input-group">
        <Input
          type="text"
          placeholder="LaTeX formula (e.g., x^2)"
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          autoComplete="off"
        />
      </InputGroup>

      <ButtonGroup
        orientation="horizontal"
        className="math-popover-button-group"
      >
        <Button
          type="button"
          onClick={insertMath}
          disabled={!latex}
          data-style="ghost"
        >
          <CornerDownLeftIcon className="tiptap-button-icon" />
        </Button>
      </ButtonGroup>

      {isActive && (
        <>
          <Separator />
          <ButtonGroup
            orientation="horizontal"
            className="math-popover-button-group"
          >
            <Button type="button" onClick={deleteMath} data-style="ghost">
              <TrashIcon className="tiptap-button-icon" />
            </Button>
          </ButtonGroup>
        </>
      )}
    </CardItemGroup>
  );
};

/**
 * Math content component for standalone use
 */
export const MathInlineContent: React.FC<{
  editor?: Editor | null;
  mobile?: boolean;
}> = ({ editor, mobile = false }) => {
  const mathPopover = useMathInlinePopover({
    editor,
  });

  return mobile ? (
    <MathMainMobile {...mathPopover} />
  ) : (
    <MathMain {...mathPopover} />
  );
};

/**
 * Math popover component for Tiptap editors.
 *
 * For custom popover implementations, use the `useMathPopover` hook instead.
 */
export const MathInlinePopover = React.forwardRef<
  HTMLButtonElement,
  MathPopoverProps
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
    } = useMathInlinePopover({
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
          <MathInlineButton
            disabled={!canInsert}
            data-active-state={isActive ? "on" : "off"}
            data-disabled={!canInsert}
            aria-label="Insert inline formula"
            aria-pressed={isActive}
            onClick={handleClick}
            {...buttonProps}
            ref={ref}
          >
            {children ?? "$x$"}
          </MathInlineButton>
        </PopoverTrigger>

        <PopoverContent>
          <MathMain
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

MathInlinePopover.displayName = "MathInlinePopover";

export default MathInlinePopover;
