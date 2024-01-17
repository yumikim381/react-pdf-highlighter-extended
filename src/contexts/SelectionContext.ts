import { createContext, useContext } from "react";
import { Content, GhostHighlight, PdfSelection, ScaledPosition } from "../types";

export const SelectionContext = createContext<PdfSelection | undefined>(
  undefined
);

export const useSelectionContext = () => {
  const pdfSelection = useContext(SelectionContext);

  if (pdfSelection === undefined) {
    throw new Error(
      "useSelectionContext must be used within a selectionTip inside a PdfHighlighter!"
    );
  }

  return pdfSelection;
};