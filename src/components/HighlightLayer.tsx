import { scaledPositionToViewport, viewportToScaled } from "../lib/coordinates";
import React, { ReactElement, ReactNode } from "react";
import {
  GhostHighlight,
  Highlight,
  HighlightTransformer,
  LTWH,
  LTWHP,
  Position,
  Scaled,
  ScaledPosition,
  Tip,
  ViewportHighlight,
} from "../types";
import screenshot from "../lib/screenshot";
import { EMPTY_ID } from "../constants";

interface HighlightLayerProps {
  highlightsByPage: { [pageNumber: string]: Array<Highlight | GhostHighlight> };
  pageNumber: string;
  scrolledToHighlightId: string | null;
  highlightTransform: HighlightTransformer;
  hideTipAndGhostHighlight: () => void;
  viewer: any;
  showTip: (tip: Tip) => void;
  setTip: (tip: Tip) => void;
}

export function HighlightLayer({
  highlightsByPage,
  pageNumber,
  scrolledToHighlightId,
  highlightTransform,
  hideTipAndGhostHighlight,
  viewer,
  showTip,
  setTip,
}: HighlightLayerProps) {
  const currentHighlights = highlightsByPage[String(pageNumber)] || [];
  return (
    <div>
      {currentHighlights.map((highlight, index) => {
        const viewportHighlight: ViewportHighlight = {
          ...highlight,
          id: "id" in highlight ? highlight.id : EMPTY_ID,
          comment: "comment" in highlight ? highlight.comment : { text: "" },
          position: scaledPositionToViewport(highlight.position, viewer),
        };

        const isScrolledTo = Boolean(
          scrolledToHighlightId === viewportHighlight.id
        );

        return highlightTransform(
          viewportHighlight,
          index,
          (tip) => {
            setTip(tip);
            showTip(tip);
          },
          hideTipAndGhostHighlight,
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
