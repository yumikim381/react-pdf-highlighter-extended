import { scaledPositionToViewport, viewportToScaled } from "../lib/coordinates";
import React, { ReactElement, ReactNode } from "react";
import {
  Highlight,
  HighlightTransformer,
  LTWH,
  LTWHP,
  Position,
  Scaled,
  ScaledPosition,
} from "../types";
import screenshot from "../lib/screenshot";

interface HighlightLayerProps {
  highlightsByPage: { [pageNumber: string]: Array<Highlight> };
  pageNumber: string;
  scrolledToHighlightId: string;
  highlightTransform: HighlightTransformer;
  tip: {
    highlight: any;
    callback: (highlight: any) => ReactElement;
  } | null;
  hideTipAndSelection: () => void;
  viewer: any;
  showTip: (highlight: any, content: ReactElement) => void;
  setState: (state: any) => void;
}

export function HighlightLayer({
  highlightsByPage,
  pageNumber,
  scrolledToHighlightId,
  highlightTransform,
  tip,
  hideTipAndSelection,
  viewer,
  showTip,
  setState,
}: HighlightLayerProps) {
  const currentHighlights = highlightsByPage[String(pageNumber)] || [];
  return (
    <div>
      {currentHighlights.map(({ position, id, ...highlight }, index) => {
        // @ts-ignore
        const viewportHighlight: any = {
          id,
          position: scaledPositionToViewport(position, viewer),
          ...highlight,
        };

        if (tip && tip.highlight.id === String(id)) {
          showTip(tip.highlight, tip.callback(viewportHighlight));
        }

        const isScrolledTo = Boolean(scrolledToHighlightId === id);

        return highlightTransform(
          viewportHighlight,
          index,
          (highlight, callback) => {
            const newTip = {
              highlight: highlight,
              callback: callback,
            };
            setState(newTip);

            showTip(highlight, callback(highlight));
          },
          hideTipAndSelection,
          (rect) => {
            const viewport = viewer.getPageView(
              (rect.pageNumber || parseInt(pageNumber)) - 1
            ).viewport;

            return viewportToScaled(rect, viewport);
          },
          (boundingRect) =>
            screenshot(boundingRect, parseInt(pageNumber), viewer),
          isScrolledTo
        );
      })}
    </div>
  );
}
