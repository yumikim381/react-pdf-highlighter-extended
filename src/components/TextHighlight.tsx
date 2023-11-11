import React, { CSSProperties } from "react";

import "../style/TextHighlight.css";
import "../style/Highlight.css";

import type { Comment, LTWHP } from "../types.js";

interface Props {
  /** Position information for the highlight. */
  position: {
    /** The bounding rectangle of the highlight. */
    boundingRect: LTWHP;

    /** An array of rectangles for each highlighted text section. */
    rects: Array<LTWHP>;
  };

  /** Optional callback function for click events. */
  onClick?: () => void;

  /** Optional callback function for mouse over events. */
  onMouseOver?: () => void;

  /** Optional callback function for mouse out events. */
  onMouseOut?: () => void;

  /** Comment associated with TextHighlight. */
  comment?: Comment;

  /** Indicates whether the component is scrolled into view. */
  isScrolledTo: boolean;

  /** Additional CSS styles for the component. */
  style?: CSSProperties;
}

/**
 * A component for displaying a highlighted text area
 *
 * @param {Props} props - The component props.
 */
const TextHighlight = ({
  position,
  onClick,
  onMouseOver,
  onMouseOut,
  comment,
  isScrolledTo,
  style,
}: Props) => {
  const highlightClass = isScrolledTo ? "TextHighlight --scrolledTo" : "";
  const { rects, boundingRect } = position;

  return (
    <div className={`TextHighlight ${highlightClass}`}>
      {comment?.icon && (
        <div
          className="TextHighlight__icon"
          style={{
            left: 20,
            top: boundingRect.top,
          }}
        >
          {comment.icon}
        </div>
      )}

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
