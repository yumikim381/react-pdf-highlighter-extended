import { PDFViewer } from "pdfjs-dist/types/web/pdf_viewer";
import React, { ReactElement, ReactNode } from "react";
import { Position } from "src/types";
import TipContainer from "./TipContainer";

interface Props {
  tipPosition: Position | null;
  tipChildren: ReactElement | null;
  viewer: PDFViewer;
}

const TipRenderer = ({ tipPosition, tipChildren, viewer }: Props) => {
  if (!tipPosition || !tipChildren) return null;

  const { boundingRect } = tipPosition;
  const pageNumber = boundingRect.pageNumber;
  const pageNode = viewer.getPageView(pageNumber - 1).div;
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
      style={{
        left: pageNode.offsetLeft + boundingRect.left + boundingRect.width / 2,
        top: boundingRect.top + pageNode.offsetTop,
        bottom: boundingRect.top + pageNode.offsetTop + boundingRect.height,
      }}
    >
      {tipChildren}
    </TipContainer>
  );
};

export default TipRenderer;
