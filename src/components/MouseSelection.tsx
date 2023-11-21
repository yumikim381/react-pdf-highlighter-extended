import React, { CSSProperties, useEffect, useRef, useState } from "react";

import { asElement } from "../lib/pdfjs-dom";
import "../style/MouseSelection.css";

import type { LTWH } from "../types.js";

interface Coords {
  x: number;
  y: number;
}

const getBoundingRect = (start: Coords, end: Coords): LTWH => {
  return {
    left: Math.min(end.x, start.x),
    top: Math.min(end.y, start.y),

    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
};

const shouldRender = (boundingRect: LTWH) => {
  return boundingRect.width >= 1 && boundingRect.height >= 1;
};

interface MouseSelectionProps {
  /**
   * Callback function for when the user stops dragging their mouse
   * and a valid area selection is made. In general, this will only
   * be called if a mouse selection is even rendered.
   *
   * @param {HTMLElement} startTarget - Whatever element the user's pointer started selection on.
   * @param {LTWH} boundingRect - The bounding rectangle of the mouse selection.
   * @param {() => void} resetSelection - Callback to reset current selection.
   */
  onSelection: (
    startTarget: HTMLElement,
    boundingRect: LTWH,
    resetSelection: () => void
  ) => void;

  /** Callback whenever a mouse selection starts */
  onDragStart: () => void;

  /**
   * Callback whenever a mouse selection ends. This will be called
   * whenever a selection resets and thus even when the selection is
   * invalid/not rendered. This should be used for handling selection
   * interference with the parent component (e.g., disabling text selection).
   */
  onDragEnd: () => void;

  /**
   * Function to determine whether the selection should start based on a mouse event.
   *
   * @param {MouseEvent} event - The mouse event.
   */
  shouldStart: (event: MouseEvent) => boolean;

  /**
   * Callback whenever the mouse selection area changes.
   *
   * @param {boolean} isVisible - Whether the mouse selection is rendered (i.e., non-zero area)
   */
  onChange: (isVisible: boolean) => void;

  /** Optional CSS styling for the mouse selection. */
  style?: CSSProperties;
}

/**
 * A component that enables the creation of rectangular and interactive
 * mouse selections within a given container. NOTE: This does not disable
 * selection in whatever container the component is placed in. That must be handled
 * through the onDragStart and onDragEnd events.
 *
 * @param {MouseSelectionProps} props - The component's properties.
 */
const MouseSelection = ({
  onSelection,
  onDragStart,
  onDragEnd,
  shouldStart,
  onChange,
  style,
}: MouseSelectionProps) => {
  const [start, setStart] = useState<Coords | null>(null);
  const [end, setEnd] = useState<Coords | null>(null);
  const [locked, setLocked] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Needed in order to grab the page info of a mouse selection
  const startTargetRef = useRef<HTMLElement | null>(null);

  const reset = () => {
    onDragEnd();
    setStart(null);
    setEnd(null);
    setLocked(false);
  };

  useEffect(() => {
    const isVisible = Boolean(start && end);
    onChange(isVisible);
  }, [start, end]);

  useEffect(() => {
    if (!rootRef.current) return;

    const container = asElement(rootRef.current.parentElement);

    let containerBoundingRect: DOMRect | null = null;

    const containerCoords = (pageX: number, pageY: number) => {
      containerBoundingRect ||= container.getBoundingClientRect();
      return {
        x: pageX - containerBoundingRect.left + container.scrollLeft,
        y:
          pageY -
          containerBoundingRect.top +
          container.scrollTop -
          window.scrollY,
      };
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!start || locked) return;
      setEnd(containerCoords(event.pageX, event.pageY));
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (!shouldStart(event)) {
        reset();
        return;
      }

      startTargetRef.current = asElement(event.target);
      onDragStart();
      setStart(containerCoords(event.pageX, event.pageY));
      setEnd(null);
      setLocked(false);
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (!start) return;
      const newEnd = containerCoords(event.pageX, event.pageY);
      const boundingRect = getBoundingRect(start, newEnd);

      if (
        !container.contains(asElement(event.target)) ||
        !shouldRender(boundingRect)
      ) {
        reset();
        return;
      }

      setEnd(newEnd);
      setLocked(true);

      if (start && end && startTargetRef.current) {
        onSelection(startTargetRef.current, boundingRect, reset);
        onDragEnd();
      }
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mousedown", handleMouseDown);

    const { ownerDocument: doc } = container;
    if (doc.body) {
      doc.body.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mousedown", handleMouseDown);
      doc.body.removeEventListener("mouseup", handleMouseUp);
    };
  }, [start, end]);

  return (
    <div className="MouseSelection-container" ref={rootRef}>
      {start && end && (
        <div
          className="MouseSelection"
          style={{ ...getBoundingRect(start, end), ...style }}
        />
      )}
    </div>
  );
};

export default MouseSelection;
