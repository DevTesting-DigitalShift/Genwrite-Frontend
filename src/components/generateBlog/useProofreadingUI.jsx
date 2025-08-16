import { useEffect, useRef, useState } from "react";

export function useProofreadingUI(editor) {
  const [activeSpan, setActiveSpan] = useState(null);
  const bubbleRef = useRef(null);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handler = (e) => {
      const target = e.target.closest(".proofreading-mark");
      if (target && target.dataset.suggestion) {
        setActiveSpan(target);
      } else {
        setActiveSpan(null);
      }
    };

    // Use mousedown for reliable capture
    editor.view.dom.addEventListener("mousedown", handler);
    return () => editor.view.dom.removeEventListener("mousedown", handler);
  }, [editor]);

  const applyChange = () => {
    if (!activeSpan || !editor) {
      console.error("Cannot apply change: activeSpan or editor is null");
      return;
    }

    const from = Number(activeSpan.dataset.from);
    const to = Number(activeSpan.dataset.to);
    const suggestion = activeSpan.dataset.suggestion;
    const original = activeSpan.dataset.original;

    if (!suggestion || isNaN(from) || isNaN(to)) {
      console.error("Invalid data attributes:", { from, to, suggestion, original });
      return;
    }

    try {
      // Apply the suggestion
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent(suggestion)
        .run();

      // Update suggestions
      const newSuggestions = editor.extensionManager.extensions
        .find((ext) => ext.name === "proofreadingDecoration")
        ?.options?.suggestions?.filter((s) => s.original !== original) || [];

      // Reconfigure the ProofreadingDecoration extension
      const proofExt = editor.extensionManager.extensions.find(
        (ext) => ext.name === "proofreadingDecoration"
      );
      if (proofExt) {
        proofExt.options.suggestions = newSuggestions;
        editor.view.dispatch(editor.state.tr); // Trigger re-render
      }

      setActiveSpan(null);
    } catch (error) {
      console.error("Error applying change:", error);
    }
  };

  const rejectChange = () => {
    if (!activeSpan || !editor) {
      console.error("Cannot reject change: activeSpan or editor is null");
      return;
    }

    const original = activeSpan.dataset.original;
    if (!original) {
      console.error("No original data attribute found");
      return;
    }

    try {
      // Remove the suggestion
      const newSuggestions = editor.extensionManager.extensions
        .find((ext) => ext.name === "proofreadingDecoration")
        ?.options?.suggestions?.filter((s) => s.original !== original) || [];

      // Reconfigure the ProofreadingDecoration extension
      const proofExt = editor.extensionManager.extensions.find(
        (ext) => ext.name === "proofreadingDecoration"
      );
      if (proofExt) {
        proofExt.options.suggestions = newSuggestions;
        editor.view.dispatch(editor.state.tr); // Trigger re-render
      }

      setActiveSpan(null);
    } catch (error) {
      console.error("Error rejecting change:", error);
    }
  };

  return {
    activeSpan,
    bubbleRef,
    applyChange,
    rejectChange,
  };
}