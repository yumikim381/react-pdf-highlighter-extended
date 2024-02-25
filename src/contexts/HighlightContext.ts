import { createContext, useContext } from "react";
import {
  HighlightBindings,
  LTWH,
  LTWHP,
  Scaled,
  ViewportHighlight,
} from "../types";

/**
 * A set of utilities for rendering highlights. Designed to be used within a
 * highlight container.
 */
export type HighlightContainerUtils = {
  /**
   * The highlight being rendered at this component.
   */
  highlight: ViewportHighlight;

  /**
   * Convert a Viewport rectangle to a scaled rectangle. Can be used
   * for storing and updating area selection highlights, for example.
   */
  viewportToScaled: (rect: LTWHP) => Scaled;

  /**
   *  Capture a PNG data url of a viewport rectangle.
   */
  screenshot: (position: LTWH) => string;

  /** 
   * Whether the highlight has been autoscrolled to.
   */
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

/**
 * Custom hook for providing {@link HighlightContainerUtils}. Must be used
 * within a child of {@link PdfHighlighter}.
 */
export const useHighlightContainerContext = () => {
  const highlightContainerUtils = useContext(HighlightContext);

  if (highlightContainerUtils === undefined) {
    throw new Error("useHighlightContainerContext must be used within a child of PdfHighlighter!");
  }

  return highlightContainerUtils;
};
