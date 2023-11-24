import { createContext, useContext } from "react";
import { Tip } from "../types";

// TODO: DOC!!!

export type TipViewerUtils = {
  currentTip: Tip | null;
  setTip: React.Dispatch<React.SetStateAction<Tip | null>>;
  isEditInProgressRef: React.MutableRefObject<boolean>;
};

export type TipContainerUtils = {
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
