import { PDFViewer } from "pdfjs-dist/types/web/pdf_viewer";
import React, { ReactElement } from "react";
import {
  HighlightContext,
  HighlightContainerUtils,
} from "../contexts/HighlightContext";
import { scaledPositionToViewport, viewportToScaled } from "../lib/coordinates";
import screenshot from "../lib/screenshot";
import {
  GhostHighlight,
  Highlight,
  HighlightBindings,
  LTWH,
  LTWHP,
  ViewportHighlight,
} from "../types";

const EMPTY_ID = "empty-id";

interface HighlightLayerProps {
  highlightsByPage: { [pageNumber: number]: Array<Highlight | GhostHighlight> };
  /** The page number of the PDF document to highlight (1 indexed). */
  pageNumber: number;
  /** ID of the highlight the parent PDF Highlighter is trying to autoscroll to. */
  scrolledToHighlightId?: string | null;
  viewer: PDFViewer;
  /**
   * Group of DOM refs for all the highlights on this layer.
   * See the type comment for more explanation.
   */
  highlightBindings: HighlightBindings;
  /**
   * This should be a HighlightContainer of some sorts. It will be given
   * appropriate context for a single highlight which it can then use to
   * render a TextHighlight, AreaHighlight, etc. in the correct place.
   */
  children: ReactElement;
}

/**
 * An internal component that holds all the highlights and ghost highlights
 * for a single page of a PDF document.
 * It should be given a HighlightContainer as a child and all children will be wrapped
 * in the correct HighlightContext. Its rendering should be managed by the PdfHighlighter.
 */
const HighlightLayer = ({
  highlightsByPage,
  pageNumber,
  scrolledToHighlightId,
  viewer,
  highlightBindings,
  children,
}: HighlightLayerProps) => {
  const currentHighlights = highlightsByPage[pageNumber] || [];

  return (
    <div>
      {currentHighlights.map((highlight, index) => {
        const viewportHighlight: ViewportHighlight = {
          ...highlight,
          id: "id" in highlight ? highlight.id : EMPTY_ID, // Give Empty ID to GhostHighlight
          comment: "comment" in highlight ? highlight.comment : { text: "" }, // Give empty comment to GhostHighlight
          position: scaledPositionToViewport(highlight.position, viewer),
        };

        const isScrolledTo = Boolean(
          scrolledToHighlightId === viewportHighlight.id,
        );

        const highlightUtils: HighlightContainerUtils = {
          highlight: viewportHighlight,
          viewportToScaled: (rect: LTWHP) => {
            const viewport = viewer.getPageView(
              (rect.pageNumber || pageNumber) - 1, // Convert to 0 index
            ).viewport;

            return viewportToScaled(rect, viewport);
          },
          screenshot: (boundingRect: LTWH) =>
            screenshot(boundingRect, pageNumber, viewer),
          isScrolledTo: isScrolledTo,
          highlightBindings,
        };

        return (
          <HighlightContext.Provider value={highlightUtils} key={index}>
            {children}
          </HighlightContext.Provider>
        );
      })}
    </div>
  );
};

export default HighlightLayer;
