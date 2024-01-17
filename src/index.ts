import PdfHighlighter from "./components/PdfHighlighter";
import TextHighlight from "./components/TextHighlight";
import MonitoredHighlightContainer from "./components/MonitoredHighlightContainer";
import AreaHighlight from "./components/AreaHighlight";
import PdfLoader from "./components/PdfLoader";
import { HighlightContainerUtils, useHighlightContainerContext } from "./contexts/HighlightContext";
import {
  viewportPositionToScaled,
  scaledPositionToViewport,
} from "./lib/coordinates";

import {
  TipUtils,
  useTipContext
} from "./contexts/TipContext";
import { useSelectionContext } from "./contexts/SelectionContext";

export {
  PdfHighlighter,
  PdfLoader,
  TextHighlight,
  MonitoredHighlightContainer,
  AreaHighlight,
  useHighlightContainerContext,
  useTipContext,
  viewportPositionToScaled,
  scaledPositionToViewport,
  useSelectionContext
};

export type {
  HighlightContainerUtils,
  TipUtils
};
export * from "./types";
