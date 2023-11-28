import { PDFViewer } from "pdfjs-dist/types/web/pdf_rendering_queue";
import React, { CSSProperties } from "react";
import { viewportPositionToScaled } from "../lib/coordinates";
import { asElement, getPageFromElement, isHTMLElement } from "../lib/pdfjs-dom";
import screenshot from "../lib/screenshot";
import MouseSelection from "./MouseSelection";
import { LTWH, LTWHP, ScaledPosition, ViewportPosition } from "src/types";
import { disableTextSelection } from "../lib/disable-text-selection";

interface MouseSelectionRendererProps {
  viewer: PDFViewer;
  /** Callback passed to MouseSelection. See doc there. */
  onChange: (isVisible: boolean) => void;
  /**
   * Callback after a valid mouse selection has been made inside of a PdfHighlighter.
   *
   * @param viewportPosition - ViewportPosition of selection.
   * @param scaledPosition - ScaledPosition of selection.
   * @param image - PNG data url of a screenshot of the mouse selection.
   * @param resetSelection - Callback to reset current selection. See MouseSelection.
   */
  onAfterSelection: (
    viewportPosition: ViewportPosition,
    scaledPosition: ScaledPosition,
    image: string,
    resetSelection: () => void,
  ) => void;
  /**
   * Function to determine whether MouseSelection should start based on the initial click event.
   * Checks for whether the click occurred inside the PdfHighlighter and on a valid element are already made.
   * This should be used strictly for any conditionals to area selection.
   *
   * @param event - The mouse event.
   */
  enableAreaSelection: (event: MouseEvent) => boolean;
  style?: CSSProperties;
}

/**
 * A helper component that defines and processes the right props to setup a MouseSelection
 * component inside of a PdfHighlighter component. Its existence is highly dependent on a
 * PdfHighlighter, but it is independently written to help declutter the PdfHighlighter.
 */
const MouseSelectionRenderer = ({
  viewer,
  onChange,
  onAfterSelection,
  enableAreaSelection,
  style,
}: MouseSelectionRendererProps) => {
  const handleSelection = (
    startTarget: HTMLElement,
    boundingRect: LTWH,
    resetSelection: () => void,
  ) => {
    const page = getPageFromElement(startTarget);
    if (!page) return;

    const pageBoundingRect: LTWHP = {
      ...boundingRect,
      top: boundingRect.top - page.node.offsetTop,
      left: boundingRect.left - page.node.offsetLeft,
      pageNumber: page.number,
    };

    const viewportPosition: ViewportPosition = {
      boundingRect: pageBoundingRect,
      rects: [],
    };

    const scaledPosition = viewportPositionToScaled(viewportPosition, viewer);

    const image = screenshot(
      pageBoundingRect,
      pageBoundingRect.pageNumber,
      viewer,
    );

    onAfterSelection(viewportPosition, scaledPosition, image, resetSelection);
  };

  return (
    <MouseSelection
      onDragStart={() => disableTextSelection(viewer, true)}
      onDragEnd={() => disableTextSelection(viewer, false)}
      onChange={onChange}
      shouldStart={(event) =>
        enableAreaSelection(event) &&
        isHTMLElement(event.target) &&
        Boolean(asElement(event.target).closest(".page"))
      }
      onSelection={handleSelection}
      style={style}
    />
  );
};

export default MouseSelectionRenderer;
