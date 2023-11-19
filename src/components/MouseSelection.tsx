import React, { Component, useEffect, useRef, useState } from "react";

import { asElement, isHTMLElement } from "../lib/pdfjs-dom";
import "../style/MouseSelection.css";

import type { LTWH } from "../types.js";

interface Coords {
  x: number;
  y: number;
}

interface Props {
  onSelection: (
    startTarget: HTMLElement,
    boundingRect: LTWH,
    resetSelection: () => void
  ) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  shouldStart: (event: MouseEvent) => boolean;
  onChange: (isVisible: boolean) => void;
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

const MouseSelection = ({
  onSelection,
  onDragStart,
  onDragEnd,
  shouldStart,
  onChange,
}: Props) => {
  const [start, setStart] = useState<Coords | null>(null);
  const [end, setEnd] = useState<Coords | null>(null);
  const [locked, setLocked] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
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
    console.log("Big useEffect called!");
    if (!rootRef.current) return;

    const container = asElement(rootRef.current.parentElement);

    let containerBoundingRect: DOMRect | null = null;

    const containerCoords = (pageX: number, pageY: number) => {
      if (!containerBoundingRect) {
        containerBoundingRect = container.getBoundingClientRect();
      }

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

      const startTarget = asElement(event.target);
      if (!isHTMLElement(startTarget)) {
        return;
      }

      startTargetRef.current = startTarget;

      onDragStart();
      setStart(containerCoords(event.pageX, event.pageY));
      setEnd(null);
      setLocked(false);
    };

    const handleMouseUp = (event: MouseEvent) => {
      // emulate listen once
      event.currentTarget?.removeEventListener(
        "mouseup",
        handleMouseUp as EventListener
      );

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

      if (!start || !newEnd) {
        return;
      }

      onSelection(startTargetRef.current!, boundingRect, reset);
      onDragEnd();
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
  });

  console.log("Render", start, end, locked);

  return (
    <div className="MouseSelection-container" ref={rootRef}>
      {start && end && (
        <div className="MouseSelection" style={getBoundingRect(start, end)} />
      )}
    </div>
  );
};

export default MouseSelection;
