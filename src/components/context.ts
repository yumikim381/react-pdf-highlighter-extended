import { createContext, useContext } from "react";
import { LTWH, LTWHP, Scaled, Tip, ViewportHighlight } from "src/types";

export type NameThis = {
  highlight: ViewportHighlight;
  index: number;
  setTip: (tip: Tip) => void;
  hideTip: () => void;
  viewportToScaled: (rect: LTWHP) => Scaled;
  screenshot: (position: LTWH) => string;
  isScrolledTo: boolean;
};

export const HighlightContext = createContext<NameThis | undefined>(undefined);

export const useHighlightContext = () => {
  const nameThis = useContext(HighlightContext);

  if (nameThis === undefined) {
    throw new Error("useHighlightContext must be used with a PdfHighlighter!");
  }

  return nameThis;
};
