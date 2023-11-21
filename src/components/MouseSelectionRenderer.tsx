import { PDFViewer } from "pdfjs-dist/types/web/pdf_rendering_queue";
import React from "react";
import { viewportPositionToScaled } from "../lib/coordinates";
import { asElement, getPageFromElement, isHTMLElement } from "../lib/pdfjs-dom";
import screenshot from "../lib/screenshot";
import MouseSelection from "./MouseSelection";
import { LTWH, ScaledPosition, ViewportPosition } from "src/types";

interface Props {
  viewer: PDFViewer;
  onChange: (isVisible: boolean) => void;
  enableAreaSelection?: (event: MouseEvent) => boolean;
  afterSelection: (
    viewportPosition: ViewportPosition,
    scaledPosition: ScaledPosition,
    image: string,
    resetSelection: () => void
  ) => void;
}
const MouseSelectionRender = ({
  viewer,
  onChange,
  enableAreaSelection,
  afterSelection,
}: Props) => {
  if (!viewer) return null;

  const disableTextSelection = (flag: boolean) => {
    viewer.viewer?.classList.toggle("PdfHighlighter--disable-selection", flag);
  };

  const handleSelection = (
    startTarget: HTMLElement,
    boundingRect: LTWH,
    resetSelection: () => void
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
        onDragStart={() => disableTextSelection(true)}
        onDragEnd={() => disableTextSelection(false)}
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
