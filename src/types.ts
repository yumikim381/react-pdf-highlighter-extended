import { ReactElement } from "react";
import { Root } from "react-dom/client";

export type LTWH = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type LTWHP = LTWH & {
  pageNumber: number;
};

export type Scaled = {
  x1: number;
  y1: number;

  x2: number;
  y2: number;

  width: number;
  height: number;

  pageNumber: number;
};

export type ViewportPosition = {
  boundingRect: LTWHP;
  rects: Array<LTWHP>;
};

export type ScaledPosition = {
  boundingRect: Scaled;
  rects: Array<Scaled>;
  usePdfCoordinates?: boolean;
};

export type Content = {
  text?: string;
  image?: string;
};

export type Comment = {
  text: string;
};

export type Highlight = {
  comment: Comment;
  content: Content;
  position: ScaledPosition;
  id: string;
};

export type GhostHighlight = Omit<Highlight, "id" | "comment">;

export type ViewportHighlight = Omit<Highlight, "position"> & {
  position: ViewportPosition;
};

export type Viewport = {
  convertToPdfPoint: (x: number, y: number) => Array<number>;
  convertToViewportRectangle: (pdfRectangle: Array<number>) => Array<number>;
  width: number;
  height: number;
};

export type Page = {
  node: HTMLElement;
  number: number;
};

/** All the DOM refs for a group of highlights on one page */
export type HighlightBindings = {
  reactRoot: Root;
  container: Element;
  textLayer: HTMLElement;
};

/** Tip for only existing highlights */
export type HighlightTip = {
  highlight: ViewportHighlight;
  content: ReactElement | ((highlight: ViewportHighlight) => ReactElement);
};

/**
 * The accepted scale values by the PDF.JS viewer.
 * Numeric entries accept floats, e.g. 1.2 = 120%
 */
export type PdfScaleValue =
  | "page-actual"
  | "page-width"
  | "page-height"
  | "page-fit"
  | "auto"
  | number;
