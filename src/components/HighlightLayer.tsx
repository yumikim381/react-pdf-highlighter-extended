import { scaledPositionToViewport, viewportToScaled } from "../lib/coordinates";
import React, { ReactElement, ReactNode } from "react";
import {
  GhostHighlight,
  Highlight,
  HighlightTip,
  HighlightTransformer,
  LTWH,
  LTWHP,
  Position,
  Scaled,
  ScaledPosition,
  ViewportHighlight,
} from "../types";
import screenshot from "../lib/screenshot";
import { EMPTY_ID } from "../constants";

interface HighlightLayerProps {
  highlightsByPage: { [pageNumber: string]: Array<Highlight | GhostHighlight> };
  pageNumber: string;
  scrolledToHighlightId: string | null;
  highlightTransform: HighlightTransformer;
  tip: HighlightTip | null;
  hideTipAndSelection: () => void;
  viewer: any;
  showTip: (highlight: any, content: ReactElement) => void;
  setTip: (tip: HighlightTip) => void;
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

        if (tip && tip.highlight.id === String(viewportHighlight.id)) {
          showTip(tip.highlight, tip.callback(viewportHighlight));
        }

        const isScrolledTo = Boolean(
          scrolledToHighlightId === viewportHighlight.id
        );

        return highlightTransform(
          viewportHighlight,
          index,
          (highlight, callback) => {
            const newTip = {
              highlight: highlight,
              callback: callback,
            };
            setTip(newTip);

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
