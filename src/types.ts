import { ReactNode } from "react";
import { Root } from "react-dom/client";

/** A rectangle as measured by a Viewport.  */
export type LTWH = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type LTWHP = LTWH & {
  pageNumber: number;
};

/**
 * "scaled" means that data structure stores (0, 1) coordinates.
 *  for clarity reasons I decided not to store actual (0, 1) coordinates, but
 *  provide width and height, so user can compute ratio himself if needed
 * - Artem Tyurin <artem.tyurin@gmail.com>
 */
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

/** The selected content of a highlight */
export type Content = {
  text?: string;
  image?: string;
};

/** The comment associated with a highlight.
 * `data` can be used anything, such as emojis, highlight categories, etc. */
export type Comment = {
  text: string;
  data?: any;
};

export type Highlight = {
  comment: Comment;
  content: Content;
  position: ScaledPosition;
  id: string;
};

/**
 * A temporary highlight. This represents a selected (text/mouse) area
 * that has been turned into a highlight, usually to fill some tip form.
 * It has just not been stored permanently yet.
 */
export type GhostHighlight = Omit<Highlight, "id" | "comment">;

export type ViewportHighlight = Omit<Highlight, "position"> & {
  position: ViewportPosition;
};

/** The viewport of a single page in a PDF.js viewer  */
export type Viewport = {
  convertToPdfPoint: (x: number, y: number) => Array<number>;
  convertToViewportRectangle: (pdfRectangle: Array<number>) => Array<number>;
  width: number;
  height: number;
};

/** A PDF.js page representation. This is the reference type for every page in the PdfHighlighter. */
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

/** A popup that can be viewed inside a PdfHighlighter. */
export type Tip = {
  position: ViewportPosition;
  content: ReactNode;
};

/**
 * The accepted scale values by the PDF.js viewer.
 * Numeric entries accept floats, e.g. 1.2 = 120%
 */
export type PdfScaleValue =
  | "page-actual"
  | "page-width"
  | "page-height"
  | "page-fit"
  | "auto"
  | number;
