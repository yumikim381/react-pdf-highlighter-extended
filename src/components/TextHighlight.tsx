import React, { CSSProperties, MouseEvent } from "react";

import "../style/TextHighlight.css";

import type { ViewportHighlight } from "../types";

interface TextHighlightProps {
  highlight: ViewportHighlight;
  onClick?: () => void;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
  /** Indicates whether the component is autoscrolled into view. */
  isScrolledTo: boolean;
  onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
  style?: CSSProperties;
}

/**
 * A component for displaying a highlighted text area
 */
const TextHighlight = ({
  highlight,
  onClick,
  onMouseOver,
  onMouseOut,
  isScrolledTo,
  onContextMenu,
  style,
}: TextHighlightProps) => {
  const highlightClass = isScrolledTo ? "TextHighlight--scrolledTo" : "";
  const { rects } = highlight.position;

  return (
    <div
      className={`TextHighlight ${highlightClass}`}
      onContextMenu={onContextMenu}
    >
      <div className="TextHighlight__parts">
        {rects.map((rect, index) => (
          <div
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
            onClick={onClick}
            key={index}
            style={{ ...rect, ...style }}
            className={`TextHighlight__part`}
          />
        ))}
      </div>
    </div>
  );
};

export default TextHighlight;
