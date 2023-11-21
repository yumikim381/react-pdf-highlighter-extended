import React, { ReactElement } from "react";
import { EMPTY_ID } from "../constants";
import { scaledPositionToViewport, viewportToScaled } from "../lib/coordinates";
import screenshot from "../lib/screenshot";
import {
  GhostHighlight,
  Highlight,
  LTWH,
  LTWHP,
  Tip,
  ViewportHighlight,
} from "../types";
import { HighlightContext, NameThis } from "../contexts/HighlightContext";
import { PDFViewer } from "pdfjs-dist/types/web/pdf_viewer";

interface HighlightLayerProps {
  /** Highlights and GhostHighlights grouped by page number in the rendered PDF Document. */
  highlightsByPage: { [pageNumber: number]: Array<Highlight | GhostHighlight> };

  /** The page number of the PDF document to highlight (1 indexed). */
  pageNumber: number;

  /** ID of the highlight the parent PDF Highlighter is trying to autoscroll to. */
  scrolledToHighlightId: string | null;

  /**
   * Should exit any existing tip or ghost highlight. Ideally this is only called by the
   * HighlightRenderer and managed by the PdfHighlighter.
   */
  hideTipAndGhostHighlight: () => void;

  /** PDF.js viewer instance */
  viewer: PDFViewer;

  /**
   * Callback to display a tip in a PdfHighlighter componenet.
   * Should be managed by the HighlightRenderer.
   * @param {Tip} tip - Currently considered highlight tip
   */
  showTip: (tip: Tip) => void;

  /**
   * Callback to update the currently held tip in the PdfHighlighter parent.
   * @param {Tip} tip - Currently considered highlight tip
   */
  setTip: (tip: Tip) => void;

  /**
   * This should be a HighlightRenderer of some sorts. It will be given
   * appropriate context for a single highlight which it can then use to
   * render a TextHighlight, AreaHighlight, etc. in the correct place.
   */
  children: ReactElement;
}

/**
 * An internal component that holds all the highlights and ghost highlights
 * for a single page of a PDF document.
 * It should be given a HighlightRenderer as a child and all children will be wrapped
 * in the correct HighlightContext. Its rendering should be managed by the PdfHighlighter.
 *
 * @param {AreaHighlightProps} props - The component's properties.
 */
const HighlightLayer = ({
  highlightsByPage,
  pageNumber,
  scrolledToHighlightId,
  hideTipAndGhostHighlight,
  viewer,
  showTip,
  setTip,
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
          scrolledToHighlightId === viewportHighlight.id
        );

        const nameThis: NameThis = {
          highlight: viewportHighlight,
          index: index,
          setTip: (tip: Tip) => {
            setTip(tip);
            showTip(tip);
          },
          hideTip: hideTipAndGhostHighlight,
          viewportToScaled: (rect: LTWHP) => {
            const viewport = viewer.getPageView(
              (rect.pageNumber || pageNumber) - 1 // Convert to 0 index
            ).viewport;

            return viewportToScaled(rect, viewport);
          },
          screenshot: (boundingRect: LTWH) =>
            screenshot(boundingRect, pageNumber, viewer),
          isScrolledTo: isScrolledTo,
        };

        return (
          <HighlightContext.Provider value={nameThis} key={index}>
            {children}
          </HighlightContext.Provider>
        );
      })}
    </div>
  );
};

export default HighlightLayer;
