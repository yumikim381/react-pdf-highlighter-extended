import React, { ReactElement, useEffect, useRef, useState } from "react";

import type { LTWHP } from "../types";

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
    console.log("update Position called!");
    if (!nodeRef.current) return;

    const { offsetHeight, offsetWidth } = nodeRef.current;
    setHeight(offsetHeight);
    setWidth(offsetWidth);
  };

  useEffect(() => {
    updatePosition();
  }, [children]);

  const shouldMove = style.top - height - 5 < scrollTop;

  const top = shouldMove ? style.bottom + 5 : style.top - height - 5;

  const left = clamp(style.left - width / 2, 0, pageBoundingRect.width - width);

  const childrenWithProps = React.Children.map(children, (child) =>
    React.cloneElement(child, {
      onUpdate: updatePosition,
      popup: {
        position: shouldMove ? "below" : "above",
      },
    })
  );

  return (
    <div
      className="PdfHighlighter__tip-container"
      style={{
        top,
        left,
      }}
      ref={nodeRef}
    >
      {childrenWithProps}
    </div>
  );
};

export default TipContainer;
