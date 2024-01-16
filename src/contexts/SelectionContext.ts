import { createContext, useContext } from "react";
import { Content, GhostHighlight, ScaledPosition } from "../types";

/**
 * A set of utilities for managing a selected area,
 * both text and rectangular.
 */
export type SelectionUtils = {
  selectionPosition: ScaledPosition;
  selectionContent: Content;
  isSelectionInProgress: () => boolean;
  clearSelection: () => void;
  /**
   * Convert the selected area into a temporary "locked" highlight.
   * This is useful if the user needs to fill a form after selecting an area
   * before making a highlight.
   */
  makeGhostHighlight: () => GhostHighlight; //TODO: Return GhostHighlightRef
};

export const SelectionContext = createContext<SelectionUtils | undefined>(
  undefined
);

export const useSelectionContext = () => {
  const selectionUtils = useContext(SelectionContext);

  if (selectionUtils === undefined) {
    throw new Error(
      "useSelectionContext must be used within a selectionTip inside a PdfHighlighter!"
    );
  }

  return selectionUtils;
};