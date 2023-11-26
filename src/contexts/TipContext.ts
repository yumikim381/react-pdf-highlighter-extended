import { createContext, useContext } from "react";
import { Tip } from "../types";

/**
 * A set of utilities for displaying a tip inside of a PdfHighlighter component.
 */
export type TipViewerUtils = {
  currentTip: Tip | null;
  setTip: (tip: Tip | null) => void;
  /**
   * If enabled, automatic tips/popups inside of a PdfHighlighter will be disabled.
   * Additional niceties will also be provided to prevent new highlights being made.
   */
  toggleEditInProgress: (flag?: boolean) => void;
  /**
   * Whether an AreaHighlight is being moved/resized, or a manual highlight edit has
   * been toggled.
   */
  isEditInProgress: () => boolean;
};

/**
 * A set of utilities to be used inside a tip displayed within a PdfHighlighter component.
 */
export type TipContainerUtils = {
  /**
   * Recorrect a tip's position to account for its size.
   * Useful if your tip resizes at any point.
   */
  updatePosition: () => void;
};

export const TipViewerContext = createContext<TipViewerUtils | undefined>(
  undefined
);

export const TipContainerContext = createContext<TipContainerUtils | undefined>(
  undefined
);

export const useTipViewerUtils = () => {
  const tipViewerUtils = useContext(TipViewerContext);

  if (tipViewerUtils === undefined) {
    throw new Error("useTipViewerUtils must be used within a PdfHighlighter!");
  }

  return tipViewerUtils;
};

export const useTipContainerUtils = () => {
  const tipContainerUtils = useContext(TipContainerContext);

  if (tipContainerUtils === undefined) {
    throw new Error(
      "useTipContainerUtils must be used within a tip inside of a PdfHighlighter!"
    );
  }

  return tipContainerUtils;
};
