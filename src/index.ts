import PdfHighlighter from "./components/PdfHighlighter";
import TextHighlight from "./components/TextHighlight";
import MonitoredHighlightContainer from "./components/MonitoredHighlightContainer";
import AreaHighlight from "./components/AreaHighlight";
import PdfLoader from "./components/PdfLoader";
import { HighlightUtils, useHighlightUtils } from "./contexts/HighlightContext";
import { SelectionUtils, useSelectionUtils } from "./contexts/SelectionContext";
import {
  viewportPositionToScaled,
  scaledPositionToViewport,
} from "./lib/coordinates";

import {
  TipViewerUtils,
  useTipViewerUtils,
  TipContainerUtils,
  useTipContainerUtils,
} from "./contexts/TipContext";

export {
  PdfHighlighter,
  PdfLoader,
  TextHighlight,
  MonitoredHighlightContainer,
  AreaHighlight,
  useHighlightUtils,
  useSelectionUtils,
  useTipViewerUtils,
  useTipContainerUtils,
  viewportPositionToScaled,
  scaledPositionToViewport,
};

export type {
  HighlightUtils,
  SelectionUtils,
  TipContainerUtils,
  TipViewerUtils,
};
export * from "./types";
