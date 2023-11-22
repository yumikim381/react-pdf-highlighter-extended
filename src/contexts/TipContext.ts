import { createContext, useContext } from "react";
import { Content, ScaledPosition } from "src/types";

export type NameThis2 = {
  selectionPosition: ScaledPosition;
  selectionContent: Content;
  hideTipAndGhostHighlight: () => void;
  makeGhostHighlight: () => void;
};

export type NameThis3 = {
  updatePosition: () => void;
};

export type NameThis4 = NameThis2 & NameThis3;

export const TipContainerContext = createContext<NameThis3 | undefined>(
  undefined
);
export const TipHighlighterContext = createContext<NameThis2 | undefined>(
  undefined
);

export const useTipContext = () => {
  const nameThis3 = useContext(TipContainerContext);
  const nameThis2 = useContext(TipHighlighterContext);

  if (nameThis2 === undefined || nameThis3 === undefined) {
    throw new Error(
      "useTipContext must be used with a TipRenderer/PdfHighlighter!"
    );
  }

  return { ...nameThis2, ...nameThis3 } as NameThis4;
};
