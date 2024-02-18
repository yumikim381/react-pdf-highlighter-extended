import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PDFViewer } from "pdfjs-dist/types/web/pdf_viewer";
import { useTipContext } from "../contexts/TipContext";

const clamp = (value: number, left: number, right: number) =>
  Math.min(Math.max(value, left), right);

const VERTICAL_PADDING = 5;

interface TipContainerProps {
  viewer: PDFViewer;
}

const TipContainer = ({ viewer }: TipContainerProps) => {
  const tipUtils = useTipContext();

  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = () => {
    if (!containerRef.current) return;
    const { offsetHeight, offsetWidth } = containerRef.current;
    setHeight(offsetHeight);
    setWidth(offsetWidth);
  };

  tipUtils.updatePosition = updatePosition;

  // useLayoutEffect ensures state is updated before re-render, preventing flickering
  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition]);

  const currentTip = tipUtils.currentTip;
  if (!currentTip) return null;

  // Destructuring current tip's position and content
  const { position, content } = currentTip;
  const { boundingRect } = position;
  const pageNumber = boundingRect.pageNumber;
  const pageNode = viewer.getPageView(pageNumber - 1).div; // Account for 1 indexing of pdf documents
  const pageBoundingClientRect = pageNode.getBoundingClientRect();
  const { left: pageLeft, width: pageWidth } = pageBoundingClientRect;

  // Calculate the position and dimensions of the tip container
  const scrollTop = viewer.container.scrollTop; // How much the viewer has been scrolled vertically
  const left = pageNode.offsetLeft + boundingRect.left + boundingRect.width / 2; // center tip over highlight
  const highlightTop = boundingRect.top + pageNode.offsetTop;
  const highlightBottom = highlightTop + boundingRect.height;

  // Determine whether the tip should be moved below the highlight
  const shouldMove = highlightTop - height - VERTICAL_PADDING < scrollTop; // Would the tip render beyond the top of the visible document?
  const top = shouldMove
    ? highlightBottom + VERTICAL_PADDING
    : highlightTop - height - VERTICAL_PADDING;

  // Ensure the tip stays within the left edge of the viewer and the right edge of the page
  const clampedLeft = clamp(left - width / 2, 0, pageLeft + pageWidth - width);

  return (
    <div
      className="PdfHighlighter__tip-container"
      style={{
        top,
        left: clampedLeft,
        height: "max-content",
        width: "max-content",
      }}
      ref={containerRef}
    >
      {content}
    </div>
  );
};

export default TipContainer;
