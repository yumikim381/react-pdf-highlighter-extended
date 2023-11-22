import PdfHighlighter from "./components/PdfHighlighter";
import TextHighlight from "./components/TextHighlight";
import MonitoredHighlightContainer from "./components/MonitoredHighlightContainer";
import AreaHighlight from "./components/AreaHighlight";
import PdfLoader from "./components/PdfLoader";
import {
  HighlightUtils,
  useHighlightContext,
} from "./contexts/HighlightContext";
import {
  SelectionUtils,
  TipContainerUtils,
  SelectionTipUtils,
  useSelectionTipContext,
} from "./contexts/SelectionTipContext";

export {
  PdfHighlighter,
  PdfLoader,
  TextHighlight,
  MonitoredHighlightContainer,
  AreaHighlight,
  useHighlightContext,
  useSelectionTipContext,
};

export type {
  HighlightUtils,
  SelectionUtils,
  TipContainerUtils,
  SelectionTipUtils,
};
export * from "./types";
