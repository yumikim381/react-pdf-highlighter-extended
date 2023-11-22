import React, { CSSProperties } from "react";

import "../style/Highlight.css";
import "../style/TextHighlight.css";

import type { ViewportPosition } from "../types.js";

interface TextHighlightProps {
  /** Position information for the highlight. */
  position: ViewportPosition;

  /** Optional callback function for click events. */
  onClick?: () => void;

  /** Optional callback function for mouse over events. */
  onMouseOver?: () => void;

  /** Optional callback function for mouse out events. */
  onMouseOut?: () => void;

  /** Indicates whether the component is autoscrolled into view. */
  isScrolledTo: boolean;

  /** Optional CSS styles for the component. */
  style?: CSSProperties;
}

/**
 * A component for displaying a highlighted text area
 *
 * @param props - The component props.
 */
const TextHighlight = ({
  position,
  onClick,
  onMouseOver,
  onMouseOut,
  isScrolledTo,
  style,
}: TextHighlightProps) => {
  const highlightClass = isScrolledTo ? "TextHighlight--scrolledTo" : "";
  const { rects } = position;

  return (
    <div className={`TextHighlight ${highlightClass}`}>
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
