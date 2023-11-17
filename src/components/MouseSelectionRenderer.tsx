import { PDFViewer } from "pdfjs-dist/types/web/pdf_rendering_queue";
import MouseSelection from "./MouseSelection";
import screenshot from "../lib/screenshot";
import { asElement, getPageFromElement, isHTMLElement } from "../lib/pdfjs-dom";
import { viewportPositionToScaled } from "../lib/coordinates";
import React from "react";

interface Props {
  viewer: PDFViewer;
  onChange: (isVisible: boolean) => void;
  enableAreaSelection?: (event: MouseEvent) => boolean;
  afterSelection: (
    viewportPosition: any,
    scaledPosition: any,
    image: any,
    resetSelection: any
  ) => void; //TODO: Fix typings
}
const MouseSelectionRender = ({
  viewer,
  onChange,
  enableAreaSelection,
  afterSelection,
}: Props) => {
  if (!viewer) return null;

  const toggleTextSelection = (flag: boolean) => {
    viewer.viewer?.classList.toggle("PdfHighlighter--disable-selection", flag);
  };
  const handleSelection = (
    startTarget: any,
    boundingRect: any,
    resetSelection: any
  ) => {
    const page = getPageFromElement(startTarget);
    if (!page) return;
    const pageBoundingRect = {
      ...boundingRect,
      top: boundingRect.top - page.node.offsetTop,
      left: boundingRect.left - page.node.offsetLeft,
      pageNumber: page.number,
    };
    const viewportPosition = {
      boundingRect: pageBoundingRect,
      rects: [],
      pageNumber: page.number,
    };
    const scaledPosition = viewportPositionToScaled(viewportPosition, viewer);
    const image = screenshot(
      pageBoundingRect,
      pageBoundingRect.pageNumber,
      viewer
    );
    afterSelection(viewportPosition, scaledPosition, image, resetSelection);
  };

  return (
    enableAreaSelection && (
      <MouseSelection
        onDragStart={() => toggleTextSelection(true)}
        onDragEnd={() => toggleTextSelection(false)}
        onChange={onChange}
        shouldStart={(event) =>
          enableAreaSelection(event) &&
          isHTMLElement(event.target) &&
          Boolean(asElement(event.target).closest(".page"))
        }
        onSelection={handleSelection}
      />
    )
  );
};
export default MouseSelectionRender;
