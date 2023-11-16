import { scaledPositionToViewport, viewportToScaled } from "../lib/coordinates";
import React from "react";
import {
  IHighlight,
  LTWH,
  LTWHP,
  Position,
  Scaled,
  ScaledPosition,
} from "../types";
import screenshot from "../lib/screenshot";

interface HighlightLayerProps<T_HT> {
  highlightsByPage: { [pageNumber: string]: Array<T_HT> };
  pageNumber: string;
  scrolledToHighlightId: string;
  highlightTransform: (
    highlight: any,
    index: number,
    setTip: (highlight: any, callback: (highlight: any) => JSX.Element) => void,
    hideTip: () => void,
    viewportToScaled: (rect: LTWHP) => Scaled,
    screenshot: (position: LTWH) => string,
    isScrolledTo: boolean
  ) => JSX.Element;
  tip: {
    highlight: any;
    callback: (highlight: any) => JSX.Element;
  } | null;
  hideTipAndSelection: () => void;
  viewer: any;
  showTip: (highlight: any, content: JSX.Element) => void;
  setState: (state: any) => void;
}

export function HighlightLayer<T_HT extends IHighlight>({
  highlightsByPage,
  pageNumber,
  scrolledToHighlightId,
  highlightTransform,
  tip,
  hideTipAndSelection,
  viewer,
  showTip,
  setState,
}: HighlightLayerProps<T_HT>) {
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
