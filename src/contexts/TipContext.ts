import { createContext, useContext } from "react";
import { Tip } from "../types";

export type TipUtils = {
    /**
   * The current tip displayed in the viewer
   */
    currentTip: Tip | null;
    /**
     * Set a tip manually to be displayed in the PDF viewer or
     * set to `null` to hide any existing tip.
     */
    setTip: React.Dispatch<React.SetStateAction<Tip | null>>;
      /**
   * Recorrect a tip's position to account for its size.
   * Useful if your tip resizes at any point.
   */
  updatePosition?: () => void;
}

export const TipContext = createContext<TipUtils | undefined>(
  undefined
);

export const useTipContext = () => {
  const tipUtils = useContext(TipContext);

  if (tipUtils === undefined) {
    throw new Error(
      "useTipContext must be used within a tip inside of a PdfHighlighter!"
    );
  }

  return tipUtils;
};