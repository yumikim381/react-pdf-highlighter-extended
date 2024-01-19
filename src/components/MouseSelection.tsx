import React, { CSSProperties, useEffect, useRef, useState } from "react";

import { asElement, getPageFromElement, isHTMLElement } from "../lib/pdfjs-dom";
import "../style/MouseSelection.css";

import { PDFViewer } from "pdfjs-dist/types/web/pdf_viewer";
import { viewportPositionToScaled } from "../lib/coordinates";
import screenshot from "../lib/screenshot";
import type { LTWH, LTWHP, ScaledPosition, ViewportPosition } from "../types";

type Coords = {
  x: number;
  y: number;
};

const getBoundingRect = (start: Coords, end: Coords): LTWH => {
  return {
    left: Math.min(end.x, start.x),
    top: Math.min(end.y, start.y),

    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
};

const getContainerCoords = (
  container: HTMLElement,
  pageX: number,
  pageY: number,
) => {
  const containerBoundingRect = container.getBoundingClientRect();
  return {
    x: pageX - containerBoundingRect.left + container.scrollLeft,
    y: pageY - containerBoundingRect.top + container.scrollTop - window.scrollY,
  };
};

interface MouseSelectionProps {
  viewer: PDFViewer;
  onSelection?: (
    viewportPosition: ViewportPosition,
    scaledPosition: ScaledPosition,
    image: string,
    resetSelection: () => void,
  ) => void;
  onReset?: () => void;
  onDragStart?: (event: MouseEvent) => void;
  onDragEnd?: (event: MouseEvent) => void;
  enableAreaSelection: (event: MouseEvent) => boolean;
  onChange?: (isVisible: boolean) => void;
  style?: CSSProperties;
}

/**
 * A component that enables the creation of rectangular and interactive mouse
 * selections within a given container. NOTE: This does not disable selection in
 * whatever container the component is placed in. That must be handled through
 * the onDragStart and onDragEnd events.
 */
const MouseSelection = ({
  viewer,
  onSelection,
  onReset,
  onDragStart,
  onDragEnd,
  enableAreaSelection,
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
    if (onReset) onReset();
    setStart(null);
    setEnd(null);
    setLocked(false);
  };

  useEffect(() => {
    if (onChange) onChange(Boolean(start && end));
    if (!rootRef.current) return;

    // Should be the PdfHighlighter
    const container = asElement(rootRef.current.parentElement);

    const handleMouseUp = (event: MouseEvent) => {
      if (!start || !end || !startTargetRef.current) return;

      const boundingRect = getBoundingRect(start, end);

      // Check if the bounding rectangle has a minimum width and height
      // to prevent recording selections with 0 area
      const shouldEnd = (boundingRect: LTWH) =>
        boundingRect.width >= 1 && boundingRect.height >= 1;

      if (
        !container.contains(asElement(event.target)) ||
        !shouldEnd(boundingRect)
      ) {
        reset();
        return;
      }

      setLocked(true);

      const page = getPageFromElement(startTargetRef.current);
      if (!page) return;

      const pageBoundingRect: LTWHP = {
        ...boundingRect,
        top: boundingRect.top - page.node.offsetTop,
        left: boundingRect.left - page.node.offsetLeft,
        pageNumber: page.number,
      };

      const viewportPosition: ViewportPosition = {
        boundingRect: pageBoundingRect,
        rects: [],
      };

      const scaledPosition = viewportPositionToScaled(viewportPosition, viewer);

      const image = screenshot(
        pageBoundingRect,
        pageBoundingRect.pageNumber,
        viewer,
      );

      if (onSelection)
        onSelection(viewportPosition, scaledPosition, image, reset);
      if (onDragEnd) onDragEnd(event);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!rootRef.current || !start || locked) return;
      setEnd(getContainerCoords(container, event.pageX, event.pageY));
    };

    const handleMouseDown = (event: MouseEvent) => {
      const shouldStart = (event: MouseEvent) =>
        enableAreaSelection(event) &&
        isHTMLElement(event.target) &&
        Boolean(asElement(event.target).closest(".page"));

      // If the user clicks anywhere outside a tip, reset the selection
      const shouldReset = (event: MouseEvent) =>
        start &&
        !asElement(event.target).closest(".PdfHighlighter__tip-container");

      if (!shouldStart(event)) {
        if (shouldReset(event)) reset();
        return;
      }

      startTargetRef.current = asElement(event.target);
      if (onDragStart) onDragStart(event);
      setStart(getContainerCoords(container, event.pageX, event.pageY));
      setEnd(null);
      setLocked(false);
    };

    /**
     * Although we register the event listeners on the PdfHighlighter component, we encapsulate
     * them in this separate component to enhance maintainability and prevent unnecessary
     * rerenders of the PdfHighlighter itself. While synthetic events on PdfHighlighter would
     * be preferable, we need to register "mouseup" on the entire document anyway. Therefore,
     * we can't avoid using useEffect. We must re-register all events on state changes, as
     * custom event listeners may otherwise receive stale state.
     */
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mousedown", handleMouseDown);

    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
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
