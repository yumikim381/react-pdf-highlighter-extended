import { createContext, useContext } from "react";
import { Content, ScaledPosition } from "src/types";

export type SelectionUtils = {
  selectionPosition: ScaledPosition;
  selectionContent: Content;
  hideTipAndGhostHighlight: () => void;
  makeGhostHighlight: () => void;
};

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
