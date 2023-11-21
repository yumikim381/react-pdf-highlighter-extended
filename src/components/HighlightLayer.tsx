import React, { ReactElement } from "react";
import { EMPTY_ID } from "../constants";
import { scaledPositionToViewport, viewportToScaled } from "../lib/coordinates";
import screenshot from "../lib/screenshot";
import {
  GhostHighlight,
  Highlight,
  LTWH,
  LTWHP,
  Tip,
  ViewportHighlight,
} from "../types";
import { HighlightContext, NameThis } from "./context";

interface HighlightLayerProps {
  highlightsByPage: { [pageNumber: string]: Array<Highlight | GhostHighlight> };
  pageNumber: string;
  scrolledToHighlightId: string | null;
  hideTipAndGhostHighlight: () => void;
  viewer: any;
  showTip: (tip: Tip) => void;
  setTip: (tip: Tip) => void;
  children: ReactElement;
}

export function HighlightLayer({
  highlightsByPage,
  pageNumber,
  scrolledToHighlightId,
  hideTipAndGhostHighlight,
  viewer,
  showTip,
  setTip,
  children,
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

        const nameThis: NameThis = {
          highlight: viewportHighlight,
          index: index,
          setTip: (tip: Tip) => {
            setTip(tip);
            showTip(tip);
          },
          hideTip: hideTipAndGhostHighlight,
          viewportToScaled: (rect: LTWHP) => {
            const viewport = viewer.getPageView(
              (rect.pageNumber || parseInt(pageNumber)) - 1
            ).viewport;

            return viewportToScaled(rect, viewport);
          },
          screenshot: (boundingRect: LTWH) =>
            screenshot(boundingRect, parseInt(pageNumber), viewer),
          isScrolledTo: isScrolledTo,
        };

        console.log("Rendered Highlight!");

        return (
          <HighlightContext.Provider value={nameThis}>
            {children}
          </HighlightContext.Provider>
        );
      })}
    </div>
  );
}
