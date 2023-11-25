import React, { ReactNode, useCallback, useRef, useState } from "react";

import { TipContainerContext } from "../contexts/TipContext";
import type { LTWHP } from "../types";

const clamp = (value: number, left: number, right: number) =>
  Math.min(Math.max(value, left), right);

const VERTICAL_PADDING = 5;

interface TipPosition {
  highlightTop: number;
  highlightBottom: number;
  left: number;
}

interface TipContainerProps {
  children: ReactNode;
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

  // TODO: useLayoutEffect instead!!
  const updatePositionRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      nodeRef.current = node;
      updatePosition();
    }
  }, []);

  const shouldMove =
    position.highlightTop - height - VERTICAL_PADDING < scrollTop; // should move below highlight?
  const top = shouldMove
    ? position.highlightBottom + 5
    : position.highlightTop - height - 5;

  // Forces tip to stay within the left edge of the pdf viewer componenet
  // and the right edge of the page. Not a perfect clamp, but functional enough.
  const left = clamp(
    position.left - width / 2,
    0,
    pageBoundingRect.left + pageBoundingRect.width - width
  );

  return (
    <TipContainerContext.Provider value={{ updatePosition }}>
      <div
        className="PdfHighlighter__tip-container"
        style={{
          top,
          left,
          height: "max-content",
          width: "max-content",
        }}
        ref={updatePositionRef}
      >
        {children}
      </div>
    </TipContainerContext.Provider>
  );
};

export default TipContainer;
