import React, { ReactElement, useEffect, useRef, useState } from "react";

import type { LTWHP } from "../types";
import { TipContainerContext } from "../contexts/TipContext";

interface Props {
  children: ReactElement;
  style: { top: number; left: number; bottom: number };
  scrollTop: number;
  pageBoundingRect: LTWHP;
}

const clamp = (value: number, left: number, right: number) =>
  Math.min(Math.max(value, left), right);

const TipContainer = ({
  children,
  style,
  scrollTop,
  pageBoundingRect,
}: Props) => {
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const nodeRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = () => {
    if (!nodeRef.current) return;

    const { offsetHeight, offsetWidth } = nodeRef.current;
    setHeight(offsetHeight);
    setWidth(offsetWidth);
  };

  const shouldMove = style.top - height - 5 < scrollTop;

  const isStyleCalculationInProgress = width === 0 && height === 0; // Fixes weird flickering

  const top = shouldMove ? style.bottom + 5 : style.top - height - 5;

  const left = clamp(style.left - width / 2, 0, pageBoundingRect.width - width);

  const childrenWithProps = React.Children.map(children, (child) =>
    React.cloneElement(child, {
      popup: {
        position: shouldMove ? "below" : "above",
      },
    })
  );

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
        {childrenWithProps}
      </div>
    </TipContainerContext.Provider>
  );
};

export default TipContainer;
