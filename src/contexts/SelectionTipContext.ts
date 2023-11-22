import { createContext, useContext } from "react";
import { Content, ScaledPosition } from "src/types";

/**
 * A set of utilities for managing a selected area,
 * both text and rectangular.
 */
export type SelectionUtils = {
  selectionPosition: ScaledPosition;
  selectionContent: Content;

  /**
   * Hide the existing tip and cancel any ghost highlight.
   * If used without a ghost highlight only the tip will hide.
   * The selected area will stay selected until the user clicks away.
   */
  hideTipAndGhostHighlight: () => void;

  /**
   * Convert the selected area into a temporary "locked" highlight.
   * This is useful if the user needs to fill a form after selecting an area
   * before making a highlight.
   */
  makeGhostHighlight: () => void;
};

/**
 * A set of utils for any component inside a tip.
 */
export type TipContainerUtils = {
  updatePosition: () => void;
};

export type SelectionTipUtils = SelectionUtils & TipContainerUtils;

export const TipContainerContext = createContext<TipContainerUtils | undefined>(
  undefined
);
export const TipHighlighterContext = createContext<SelectionUtils | undefined>(
  undefined
);

export const useSelectionTipContext = () => {
  const tipContainerUtils = useContext(TipContainerContext);
  const selectionUtils = useContext(TipHighlighterContext);

  if (selectionUtils === undefined || tipContainerUtils === undefined) {
    throw new Error(
      "useSelectionTipContext must be used with a TipRenderer/PdfHighlighter!"
    );
  }

  return { ...selectionUtils, ...tipContainerUtils } as SelectionTipUtils;
};
