import React, { CSSProperties, useEffect, useRef, useState } from "react";

import { asElement, getPageFromElement, isHTMLElement } from "../lib/pdfjs-dom";
import "../style/MouseSelection.css";

import { PDFViewer } from "pdfjs-dist/types/web/pdf_viewer";
import { viewportPositionToScaled } from "../lib/coordinates";
import screenshot from "../lib/screenshot";
import type { LTWH, LTWHP, ScaledPosition, ViewportPosition } from "../types";
import { usePdfHighlighterContext } from "../contexts/PdfHighlighterContext";

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

/**
 * A component that enables the creation of rectangular and interactive
 * mouse selections within a given container. NOTE: This does not disable
 * selection in whatever container the component is placed in. That must be handled
 * through the onDragStart and onDragEnd events.
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

  const handleMouseUp = (event: MouseEvent) => {
    if (!rootRef.current || !start || !end || !startTargetRef.current) return;

    const container = asElement(rootRef.current.parentElement);

    const boundingRect = getBoundingRect(start, end);

    // It's impossible to screenshot or open a context menu on a rect with 0 area
    // So we need to prevent their render.
    const shouldEnd = (boundingRect: LTWH) => {
      return boundingRect.width >= 1 && boundingRect.height >= 1;
    };

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
    console.log("mouse move!");
    if (!rootRef.current || !start || locked) return;

    const container = asElement(rootRef.current.parentElement);
    setEnd(getContainerCoords(container, event.pageX, event.pageY));
    console.log("new end set!");
  };

  const handleMouseDown = (event: MouseEvent) => {
    console.log("mousedown!");
    const shouldStart = (event: MouseEvent) =>
      enableAreaSelection(event) &&
      isHTMLElement(event.target) &&
      Boolean(asElement(event.target).closest(".page"));

    const shouldReset = (event: MouseEvent) =>
      start &&
      !asElement(event.target).closest(".PdfHighlighter__tip-container");

    if (!rootRef.current || !shouldStart(event)) {
      if (shouldReset(event)) reset();
      return;
    }

    const container = asElement(rootRef.current.parentElement);

    startTargetRef.current = asElement(event.target);
    if (onDragStart) onDragStart(event);
    setStart(getContainerCoords(container, event.pageX, event.pageY));
    setEnd(null);
    setLocked(false);
    console.log("new start set!");
  };

  const reset = () => {
    if (onReset) onReset();
    setStart(null);
    setEnd(null);
    setLocked(false);
  };

  useEffect(() => {
    if (onChange) onChange(Boolean(start && end));
  }, [start, end]);

  useEffect(() => {
    if (!rootRef.current) return;

    const container = asElement(rootRef.current.parentElement);

    console.log(container);

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mousedown", handleMouseDown);

    const { ownerDocument: doc } = container;
    if (doc.body) doc.body.addEventListener("mouseup", handleMouseUp);

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
