import { PDFViewer } from "pdfjs-dist/types/web/pdf_viewer";
import React from "react";
import { useTipContext } from "../contexts/TipContext";
import TipContainer from "./TipContainer";

interface TipRendererProps {
  viewer: PDFViewer;
}

/**
 * A helper component that defines and processes the right props to setup a TipContainer
 * component inside of a PdfHighlighter component. Its existence is highly dependent on a
 * PdfHighlighter, but it is independently written to help declutter the PdfHighlighter.
 */
const TipRenderer = ({ viewer }: TipRendererProps) => {
  const tipUtils = useTipContext();
  if (!tipUtils.currentTip) return null;

  const { position, content } = tipUtils.currentTip;
  const { boundingRect } = position;
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
      {content}
    </TipContainer>
  );
};

export default TipRenderer;
