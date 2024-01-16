import { createContext, useContext } from "react";
import {
  HighlightBindings,
  LTWH,
  LTWHP,
  Scaled,
  ViewportHighlight,
} from "../types";

/**
 * A set of utilities for existing highlights designed to be used
 * by a highlight container.
 */
export type HighlightContainerUtils = {
  highlight: ViewportHighlight;
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

export const HighlightContext = createContext<HighlightContainerUtils | undefined>(
  undefined
);

export const useHighlightContainerContext = () => {
  const highlightContainerUtils = useContext(HighlightContext);

  if (highlightContainerUtils === undefined) {
    throw new Error("useHighlightContainerContext must be used with a PdfHighlighter!"); //TODO: CHANGE
  }

  return highlightContainerUtils;
};
