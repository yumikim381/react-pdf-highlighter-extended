import { createContext, useContext } from "react";
import { Content, ScaledPosition } from "../types";

/**
 * A set of utilities for managing a selected area,
 * both text and rectangular.
 */
export type SelectionUtils = {
  selectionPosition: ScaledPosition;
  selectionContent: Content;
  /**
   * Cancel any ghost highlight.
   * The selected area will stay selected until the user clicks away.
   */
  removeGhostHighlight: () => void;
  /**
   * Convert the selected area into a temporary "locked" highlight.
   * This is useful if the user needs to fill a form after selecting an area
   * before making a highlight.
   */
  makeGhostHighlight: () => void;
};

export const SelectionContext = createContext<SelectionUtils | undefined>(
  undefined
);

export const useSelectionUtils = () => {
  const selectionUtils = useContext(SelectionContext);

  if (selectionUtils === undefined) {
    throw new Error(
      "useSelectionUtils must be used within a selectionTip inside a PdfHighlighter!"
    );
  }

  return selectionUtils;
};
