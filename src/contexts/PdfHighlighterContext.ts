import { createContext, useContext } from "react";
import { GhostHighlight, PdfSelection } from "../types";
import { PdfLoaderContext } from "./PdfLoaderContext";

export type PdfHighlighterUtils = {
    isEditingOrHighlighting: () => boolean;
    getCurrentSelection: () => PdfSelection | undefined;
    getGhostHighlight: () => GhostHighlight | undefined;
  /**
   * Cancel any ghost highlight.
   * The selected area will stay selected until the user clicks away.
   */
  removeGhostHighlight: () => void;
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
  isSelectionInProgress: () => boolean;
}

export const PdfHighlighterContext = createContext<PdfHighlighterUtils | undefined>(
  undefined
);

export const usePdfHighlighterContext = () => {
  const pdfHighlighterUtils = useContext(PdfHighlighterContext);

  if (pdfHighlighterUtils === undefined) {
    throw new Error(
      "usePdfHighlighterContext must be used within PdfHighlighter!"
    );
  }

  return pdfHighlighterUtils;
};