import React, { ReactElement, useEffect, useRef, useState } from "react";

import type { LTWHP } from "../types";
import { TipContainerContext } from "../contexts/SelectionTipContext";

const clamp = (value: number, left: number, right: number) =>
  Math.min(Math.max(value, left), right);

const VERTICAL_PADDING = 5;

interface TipPosition {
  highlightTop: number;
  highlightBottom: number;
  left: number;
}

interface TipContainerProps {
  children: ReactElement;
  position: TipPosition;
  scrollTop: number;
  pageBoundingRect: LTWHP;
}

/**
 * A component that manages rendering and placement of a tip around a highlight.
 * It also provides the ability for children to update the position of the container
 * via context.
 */
const TipContainer = ({
  children,
  position,
  scrollTop,
  pageBoundingRect,
}: TipContainerProps) => {
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const nodeRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = () => {
    if (!nodeRef.current) return;

    const { offsetHeight, offsetWidth } = nodeRef.current;
    setHeight(offsetHeight);
    setWidth(offsetWidth);
  };

  // We can only get width and height after mount
  // So we have to run updatePosition then to make the tip visible.
  useEffect(() => {
    updatePosition();
  }, []);

  const shouldMove =
    position.highlightTop - height - VERTICAL_PADDING < scrollTop; // should move below highlight?
  const isStyleCalculationInProgress = width === 0 && height === 0; // Fixes flickering
  const top = shouldMove
    ? position.highlightBottom + 5
    : position.highlightTop - height - 5;

  const left = clamp(
    position.left - width / 2,
    0,
    pageBoundingRect.width - width
  ); // Force tip into page bounds

  return (
    <TipContainerContext.Provider value={{ updatePosition }}>
      <div
        className="PdfHighlighter__tip-container"
        style={{
          visibility: isStyleCalculationInProgress ? "hidden" : "visible",
          top,
          left,
        }}
        ref={nodeRef}
      >
        {children}
      </div>
    </TipContainerContext.Provider>
  );
};

export default TipContainer;
