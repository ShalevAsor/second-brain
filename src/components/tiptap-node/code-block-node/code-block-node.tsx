"use client";
/*
NodeViewWrapper - Container component that wraps the custom node. 
Handles positioning, selection, and Tiptap integration.
NodeViewContent - Renders the actual editable content inside the node (the code text)
*/
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
// TypeScript type definition for the props that Tiptap passes to custom NodeView components
import { NodeViewProps } from "@tiptap/core";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CodeBlockComponent({
  node, // The ProseMirror node object containing data about this specific code block
  updateAttributes, //Function to update the node's attributes (like changing the language)
  extension, //  Reference to the CodeBlockLowlight extension itself (gives access to configuration)
}: NodeViewProps) {
  // Get the current language
  const language = node.attrs.language || "auto";

  // Get all available languages from lowlight
  const languages = extension.options.lowlight.listLanguages();

  return (
    <NodeViewWrapper className="code-block">
      <Select
        value={language}
        onValueChange={(value) => updateAttributes({ language: value })}
      >
        <SelectTrigger
          className="absolute right-2 top-2 w-[140px] z-10 bg-background/95"
          aria-label="Select programming language"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">Auto</SelectItem>
          {languages.map((lang: string) => (
            <SelectItem key={lang} value={lang}>
              {lang}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <pre>
        <code>
          <NodeViewContent />
        </code>
      </pre>
    </NodeViewWrapper>
  );
}
