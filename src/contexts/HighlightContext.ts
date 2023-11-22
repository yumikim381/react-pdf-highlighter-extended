import { createContext, useContext } from "react";
import {
  LTWH,
  LTWHP,
  Scaled,
  HighlightTip,
  ViewportHighlight,
} from "src/types";

export type HighlightUtils = {
  highlight: ViewportHighlight;
  index: number;
  setTip: (tip: HighlightTip) => void;
  hideTip: () => void;
  viewportToScaled: (rect: LTWHP) => Scaled;
  screenshot: (position: LTWH) => string;
  isScrolledTo: boolean;
};

export const HighlightContext = createContext<HighlightUtils | undefined>(
  undefined
);

export const useHighlightContext = () => {
  const highlightUtils = useContext(HighlightContext);

  if (highlightUtils === undefined) {
    throw new Error("useHighlightContext must be used with a PdfHighlighter!");
  }

  return highlightUtils;
};
