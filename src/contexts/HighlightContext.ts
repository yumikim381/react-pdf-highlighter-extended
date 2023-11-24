import { createContext, useContext } from "react";
import {
  HighlightBindings,
  LTWH,
  LTWHP,
  Scaled,
  ViewportHighlight,
} from "src/types";

/**
 * A set of utilities for existing highlights designed to be used
 * by a highlight renderer.
 */
export type HighlightUtils = {
  highlight: ViewportHighlight;
  key: number;
  isSelectionInProgress: () => boolean;

  /**
   * Convert a Viewport rectangle to a scaled rectangle. Can be used
   * for storing and updating area selection highlights, for example.
   */
  viewportToScaled: (rect: LTWHP) => Scaled;

  /** Capture a PNG data url of a viewport rectangle */
  screenshot: (position: LTWH) => string;

  /** Whether the highlight has been autoscrolled to. */
  isScrolledTo: boolean;

  /**
   * All the DOM refs for the highlights shared on the same page
   * as `highlight`
   */
  highlightBindings: HighlightBindings;
};

export const HighlightContext = createContext<HighlightUtils | undefined>(
  undefined
);

export const useHighlightUtils = () => {
  const highlightUtils = useContext(HighlightContext);

  if (highlightUtils === undefined) {
    throw new Error("useHighlightUtils must be used with a PdfHighlighter!");
  }

  return highlightUtils;
};
