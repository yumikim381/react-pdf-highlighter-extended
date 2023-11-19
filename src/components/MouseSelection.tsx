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
    if (!isHTMLElement(container)) return;

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

    container.addEventListener("mousemove", (event: MouseEvent) => {
      if (!start || locked) return;
      setEnd(containerCoords(event.pageX, event.pageY));
    });

    container.addEventListener("mousedown", (event: MouseEvent) => {
      console.log("Mouse down!");
      if (!shouldStart(event)) {
        reset();
        return;
      }

      console.log("Should start!");

      const startTarget = asElement(event.target);
      if (!isHTMLElement(startTarget)) {
        return;
      }

      onDragStart();
      console.log("onDragStart");
      setStart(containerCoords(event.pageX, event.pageY));
      setEnd(null);
      setLocked(false);

      const onMouseUp = (event: MouseEvent): void => {
        // emulate listen once
        event.currentTarget?.removeEventListener(
          "mouseup",
          onMouseUp as EventListener
        );

        if (!start) return;
        const end = containerCoords(event.pageX, event.pageY);
        const boundingRect = getBoundingRect(start, end);

        if (
          !isHTMLElement(event.target) ||
          !container.contains(asElement(event.target)) ||
          !shouldRender(boundingRect)
        ) {
          reset();
          return;
        }

        setEnd(end);
        setLocked(true);

        if (!start || !end) {
          return;
        }

        if (isHTMLElement(event.target)) {
          onSelection(startTarget, boundingRect, reset);

          onDragEnd();
        }

        const { ownerDocument: doc } = container;
        if (doc.body) {
          doc.body.addEventListener("mouseup", onMouseUp);
        }
      };
    });
  }, []);

  return (
    <div className="MouseSelection-container" ref={rootRef}>
      {start && end && (
        <div className="MouseSelection" style={getBoundingRect(start, end)} />
      )}
    </div>
  );
};

export default MouseSelection;
