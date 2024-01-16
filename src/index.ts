import PdfHighlighter from "./components/PdfHighlighter";
import TextHighlight from "./components/TextHighlight";
import MonitoredHighlightContainer from "./components/MonitoredHighlightContainer";
import AreaHighlight from "./components/AreaHighlight";
import PdfLoader from "./components/PdfLoader";
import { HighlightContainerUtils, useHighlightContainerContext } from "./contexts/HighlightContext";
import { SelectionUtils, useSelectionContext } from "./contexts/SelectionContext";
import {
  viewportPositionToScaled,
  scaledPositionToViewport,
} from "./lib/coordinates";

import {
  TipUtils,
  useTipContext
} from "./contexts/TipContext";

export {
  PdfHighlighter,
  PdfLoader,
  TextHighlight,
  MonitoredHighlightContainer,
  AreaHighlight,
  useHighlightContainerContext,
  useSelectionContext,
  useTipContext,
  viewportPositionToScaled,
  scaledPositionToViewport,
};

export type {
  HighlightContainerUtils,
  SelectionUtils,
  TipUtils
};
export * from "./types";
