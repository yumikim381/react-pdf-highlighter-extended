import { PDFViewer } from "pdfjs-dist/types/web/pdf_viewer";
import React, { ReactElement } from "react";
import { ViewportPosition } from "src/types";
import TipContainer from "./TipContainer";

interface TipRendererProps {
  tipPosition: ViewportPosition | null;
  tipChildren: ReactElement | null;
  viewer: PDFViewer;
}

/**
 * A helper component that defines and processes the right props to setup a TipContainer
 * component inside of a PdfHighlighter component. Its existence is highly dependent on a
 * PdfHighlighter, but it is independently written to help declutter the PdfHighlighter.
 */
const TipRenderer = ({
  tipPosition,
  tipChildren,
  viewer,
}: TipRendererProps) => {
  if (!tipPosition || !tipChildren) return null;

  const { boundingRect } = tipPosition;
  const pageNumber = boundingRect.pageNumber;
  const pageNode = viewer.getPageView(pageNumber - 1).div; // Account for 1 indexing of pdf documents
  const pageBoundingClientRect = pageNode.getBoundingClientRect();

  // pageBoundingClientRect isn't enumerable
  const pageBoundingRect = {
    bottom: pageBoundingClientRect.bottom,
    height: pageBoundingClientRect.height,
    left: pageBoundingClientRect.left,
    right: pageBoundingClientRect.right,
    top: pageBoundingClientRect.top,
    width: pageBoundingClientRect.width,
    x: pageBoundingClientRect.x,
    y: pageBoundingClientRect.y,
    pageNumber: pageNumber,
  };

  return (
    <TipContainer
      scrollTop={viewer.container.scrollTop}
      pageBoundingRect={pageBoundingRect}
      position={{
        left: pageNode.offsetLeft + boundingRect.left + boundingRect.width / 2, // centre tip over highlight
        highlightTop: boundingRect.top + pageNode.offsetTop,
        highlightBottom:
          boundingRect.top + pageNode.offsetTop + boundingRect.height,
      }}
    >
      {tipChildren}
    </TipContainer>
  );
};

export default TipRenderer;
