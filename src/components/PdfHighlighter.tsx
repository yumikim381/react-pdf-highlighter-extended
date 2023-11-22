import "pdfjs-dist/web/pdf_viewer.css";
import "../style/PdfHighlighter.css";
import "../style/pdf_viewer.css";

import debounce from "lodash.debounce";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  EventBus,
  NullL10n,
  PDFLinkService,
  PDFViewer,
} from "pdfjs-dist/legacy/web/pdf_viewer";
import React, {
  CSSProperties,
  PointerEventHandler,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from "react";
import { Root, createRoot } from "react-dom/client";
import { scaledToViewport, viewportPositionToScaled } from "../lib/coordinates";
import getBoundingRect from "../lib/get-bounding-rect";
import getClientRects from "../lib/get-client-rects";
import groupHighlightsByPage from "../lib/group-highlights-by-page";
import {
  asElement,
  findOrCreateContainerLayer,
  getPagesFromRange,
  getWindow,
  isHTMLElement,
} from "../lib/pdfjs-dom";
import type {
  Content,
  GhostHighlight,
  Highlight,
  ViewportPosition,
  ScaledPosition,
  Tip,
  PdfScaleValue,
} from "../types";
import TipRenderer from "./TipRenderer";
import HighlightLayer from "./HighlightLayer";
import MouseSelectionRenderer from "./MouseSelectionRenderer";

interface HighlightRoot {
  reactRoot: Root;
  container: Element;
}

const SCROLL_MARGIN = 10;
const TIP_WAIT = 500; // Debounce wait time in milliseconds for a selection changing and a tip being displayed
const RESIZE_WAIT = 500; // Debounce wait time in milliseconds for the window being resized and the PDF Viewer adjusting

interface PdfHighlighterProps {
  /** Array of highlights to render. */
  highlights: Array<Highlight>;

  /** Callback whenever a user scrolls the PDF document */
  onScrollChange: () => void;

  /**
   * Runs on every document load. Provides a reference function, scrollTo,
   * to the parent which it can then use to make the PDF Viewer auto scroll
   * to a given highlight. The highlight context will also be notified of this
   * through the isScrolledTo property to allow for styling.
   *
   * @param scrollTo - Callback the parent component can use to make the PDF Viewer auto scroll to a highlight
   */
  scrollRef: (scrollTo: (highlight: Highlight) => void) => void;

  /** PDF document to view. Designed to be provided by a PdfLoader */
  pdfDocument: PDFDocumentProxy;

  /** Specifies the scale value of the PDF Viewer. */
  pdfScaleValue?: PdfScaleValue;

  /**
   * Tip to display whenever a user selects "Add Highlight" on a new
   * selection. TODO: Rework this into an "expandedTip" component
   * that has its own context.
   *
   * @param position - The position of the highlighted area.
   * @param content - The content of the highlighted area.
   * @param hideTipAndGhostHighlight - Callback to close the current tip and exit the ghost highlight.
   * @param transformSelection - Transform the current selected area into a ghost highlight
   * @returns - The expanded tip when the user selects "Add Highlight"
   */
  onSelectionFinished: (
    position: ScaledPosition,
    content: Content,
    hideTipAndGhostHighlight: () => void,
    transformSelection: () => void
  ) => ReactElement | null;

  /**
   * The optional conditional for starting an area selection by mouse.
   * If not provided Area Selection will be disabled.
   */
  enableAreaSelection?: (event: MouseEvent) => boolean;

  /** Optional CSS styling for mouse selection area. */
  mouseSelectionStyle?: CSSProperties;

  /**
   * This should be a HighlightRenderer of some sorts. It will be given
   * appropriate context for a single highlight which it can then use to
   * render a TextHighlight, AreaHighlight, etc. in the correct place.
   */
  children: ReactElement;
}

/**
 * This is a large-scale PDF viewer component designed to facilitate highlighting.
 * It should be used as a child to a PdfLoader to ensure proper document loading.
 * This does not handle rendering of highlights, but it can provide a HighlightContext
 * to a HighlightRenderer for each highlight per page per document with capabilities
 * to generate tips. However, this does handle text selection and (optionally) area selection.
 *
 * @param props - The component's properties.
 */
const PdfHighlighter = ({
  highlights,
  onScrollChange,
  scrollRef,
  pdfDocument,
  pdfScaleValue = "auto",
  onSelectionFinished,
  enableAreaSelection,
  mouseSelectionStyle,
  children,
}: PdfHighlighterProps) => {
  const containerNodeRef = useRef<HTMLDivElement | null>(null);
  const highlightsRef = useRef(highlights); // Reference to all highlights
  const highlightRootsRef = useRef<{ [page: number]: HighlightRoot }>({}); // Reference to highlight roots per page
  const ghostHighlightRef = useRef<GhostHighlight | null>(null); // Reference to in-progress highlight (after "Add Highlight is selected")
  const isCollapsedRef = useRef(true); // Reference to whether the selection is collapsed (i.e., no text in it)
  const rangeRef = useRef<Range | null>(null); // Reference to nodes in the selection
  const scrolledToHighlightIdRef = useRef<string | null>(null); // Reference to the ID of the highlight autoscrolled to
  const isAreaSelectionInProgressRef = useRef(false);
  const pdfScaleValueRef = useRef(pdfScaleValue);
  const [_, setTip] = useState<Tip | null>(null); // Reference for user to set Tip properties (highlight, content)
  const [tipPosition, setTipPosition] = useState<ViewportPosition | null>(null); // Reference to the position of the Tip
  const [tipChildren, setTipChildren] = useState<ReactElement | null>(null); // Reference to the children of the Tip

  // These should only change when a document loads/unloads
  const eventBusRef = useRef<EventBus>(new EventBus());
  const linkServiceRef = useRef<PDFLinkService>(
    new PDFLinkService({
      eventBus: eventBusRef.current,
      externalLinkTarget: 2,
    })
  );
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const viewerRef = useRef<PDFViewer | null>(null);
  const [isViewerReady, setViewerReady] = useState(false);

  // Initialise PDF Viewer and listeners
  useEffect(() => {
    resizeObserverRef.current = new ResizeObserver(debouncedHandleScaleValue);
    const doc = containerNodeRef.current?.ownerDocument;
    if (!doc || !containerNodeRef.current) return;

    eventBusRef.current.on("textlayerrendered", renderHighlightLayers);
    eventBusRef.current.on("pagesinit", handleDocumentReady);
    doc.addEventListener("selectionchange", handleSelectionChange);
    doc.addEventListener("keydown", handleKeyDown);
    resizeObserverRef.current.observe(containerNodeRef.current);

    viewerRef.current =
      viewerRef.current ||
      new PDFViewer({
        container: containerNodeRef.current!,
        eventBus: eventBusRef.current,
        textLayerMode: 2, // EnablePermissions (i.e., don't allow selecting if PDF prevents it)
        removePageBorders: true,
        linkService: linkServiceRef.current,
        l10n: NullL10n,
      });

    linkServiceRef.current.setDocument(pdfDocument);
    linkServiceRef.current.setViewer(viewerRef.current);
    viewerRef.current.setDocument(pdfDocument);

    setViewerReady(true);

    return () => {
      eventBusRef.current.off("pagesinit", handleDocumentReady);
      eventBusRef.current.off("textlayerrendered", renderHighlightLayers);
      doc.removeEventListener("selectionchange", handleSelectionChange);
      doc.removeEventListener("keydown", handleKeyDown);
      resizeObserverRef.current?.disconnect();
      setViewerReady(false);
    };
  }, []);

  // Update highlights if new ones are provided
  useEffect(() => {
    highlightsRef.current = highlights;
    renderHighlightLayers();
  }, [highlights]);

  const findOrCreateHighlightLayer = (page: number) => {
    const { textLayer } = viewerRef.current!.getPageView(page - 1) || {};
    if (!textLayer) return null;

    return findOrCreateContainerLayer(
      textLayer.div,
      "PdfHighlighter__highlight-layer"
    );
  };

  const showTip = (tip: Tip) => {
    if (
      !isCollapsedRef.current || // Selection has no text in it
      ghostHighlightRef.current || // There's already a ghostHighlight and expanded tip
      isAreaSelectionInProgressRef.current
    )
      return;
    setTipPosition(tip.highlight.position);

    if (typeof tip.content === "function") {
      setTipChildren(tip.content(tip.highlight));
    } else {
      // content is a plain ReactElement
      setTipChildren(tip.content);
    }
  };

  const hideTipAndGhostHighlight = () => {
    setTipPosition(null);
    setTipChildren(null);
    ghostHighlightRef.current = null;
    setTip(null);
    renderHighlightLayers();
  };

  const scrollTo = (highlight: Highlight) => {
    const { boundingRect, usePdfCoordinates } = highlight.position;
    const pageNumber = boundingRect.pageNumber;

    viewerRef.current!.container.removeEventListener("scroll", handleScroll);

    const pageViewport = viewerRef.current!.getPageView(
      pageNumber - 1
    ).viewport;

    viewerRef.current!.scrollPageIntoView({
      pageNumber,
      destArray: [
        null, // null since we pass pageNumber already as an arg
        { name: "XYZ" },
        ...pageViewport.convertToPdfPoint(
          0, // Default x coord
          scaledToViewport(boundingRect, pageViewport, usePdfCoordinates).top -
            SCROLL_MARGIN
        ),
        0, // Default z coord
      ],
    });

    scrolledToHighlightIdRef.current = highlight.id;
    renderHighlightLayers();

    // wait for scrolling to finish
    setTimeout(() => {
      viewerRef.current!.container.addEventListener("scroll", handleScroll);
    }, 100);
  };

  const handleDocumentReady = () => {
    debouncedHandleScaleValue();
    scrollRef(scrollTo);
  };

  const handleSelectionChange = () => {
    const container = containerNodeRef.current;
    const selection = getWindow(container).getSelection();

    if (!selection) return;

    const newRange = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    if (selection.isCollapsed) {
      isCollapsedRef.current = true;
      return;
    }

    if (
      !newRange ||
      !container ||
      !container.contains(newRange.commonAncestorContainer) // Sanity check the selected text is in the container
    ) {
      return;
    }

    isCollapsedRef.current = false;
    rangeRef.current = newRange;
    debouncedAfterSelection();
  };

  const handleScroll = () => {
    onScrollChange();
    scrolledToHighlightIdRef.current = null;
    renderHighlightLayers();
  };

  const handleMouseDown: PointerEventHandler = (event) => {
    if (
      !isHTMLElement(event.target) ||
      asElement(event.target).closest(".PdfHighlighter__tip-container") // Ignore selections on tip container
    ) {
      return;
    }

    hideTipAndGhostHighlight();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === "Escape") {
      hideTipAndGhostHighlight();
    }
  };

  const afterSelection = () => {
    if (!rangeRef.current || isCollapsedRef.current) {
      return;
    }

    const pages = getPagesFromRange(rangeRef.current);
    if (!pages || pages.length === 0) {
      return;
    }

    const rects = getClientRects(rangeRef.current, pages);
    if (rects.length === 0) {
      return;
    }

    const boundingRect = getBoundingRect(rects);
    const viewportPosition: ViewportPosition = {
      boundingRect,
      rects,
    };

    const content: Content = { text: rangeRef.current.toString() };
    const scaledPosition = viewportPositionToScaled(
      viewportPosition,
      viewerRef.current!
    );

    setTipPosition(viewportPosition);
    setTipChildren(
      onSelectionFinished(
        scaledPosition,
        content,
        hideTipAndGhostHighlight,
        () => {
          ghostHighlightRef.current = {
            content: content,
            position: scaledPosition,
          };
          renderHighlightLayers();
        }
      )
    );
  };

  const debouncedAfterSelection = debounce(afterSelection, TIP_WAIT);

  const handleScaleValue = () => {
    if (viewerRef.current) {
      viewerRef.current.currentScaleValue = pdfScaleValueRef.current.toString();
    }
  };

  // Update scale value if new one is provided
  useEffect(() => {
    pdfScaleValueRef.current = pdfScaleValue;
    debouncedHandleScaleValue();
  }, [pdfScaleValue]);

  const debouncedHandleScaleValue = debounce(handleScaleValue, RESIZE_WAIT);

  const renderHighlightLayers = () => {
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
      const highlightRoot = highlightRootsRef.current[pageNumber];

      // Need to check if container is still attached to the DOM as PDF.js can unload pages.
      if (highlightRoot?.container?.isConnected) {
        renderHighlightLayer(highlightRoot.reactRoot, pageNumber);
      } else {
        const highlightLayer = findOrCreateHighlightLayer(pageNumber);

        if (highlightLayer) {
          const reactRoot = createRoot(highlightLayer);
          highlightRootsRef.current[pageNumber] = {
            reactRoot,
            container: highlightLayer,
          };
          renderHighlightLayer(reactRoot, pageNumber);
        }
      }
    }
  };

  const renderHighlightLayer = (root: Root, pageNumber: number) => {
    if (!viewerRef.current) return;

    root.render(
      <HighlightLayer
        highlightsByPage={groupHighlightsByPage([
          ...highlightsRef.current,
          ghostHighlightRef.current,
        ])}
        pageNumber={pageNumber}
        scrolledToHighlightId={scrolledToHighlightIdRef.current}
        hideTipAndGhostHighlight={hideTipAndGhostHighlight}
        viewer={viewerRef.current}
        showTip={showTip}
        setTip={setTip}
        children={children}
      />
    );
  };

  return (
    <div onPointerDown={handleMouseDown}>
      <div ref={containerNodeRef} className="PdfHighlighter">
        <div className="pdfViewer" />
        {isViewerReady && (
          <TipRenderer
            tipPosition={tipPosition}
            tipChildren={tipChildren}
            viewer={viewerRef.current!}
          />
        )}
        {isViewerReady && enableAreaSelection && (
          <MouseSelectionRenderer
            viewer={viewerRef.current!}
            onChange={(isVisible) =>
              (isAreaSelectionInProgressRef.current = isVisible)
            }
            enableAreaSelection={enableAreaSelection}
            style={mouseSelectionStyle}
            afterSelection={(
              viewportPosition,
              scaledPosition,
              image,
              resetSelection
            ) => {
              setTipPosition(viewportPosition);
              setTipChildren(
                onSelectionFinished(
                  scaledPosition,
                  { image },
                  hideTipAndGhostHighlight,
                  () => {
                    ghostHighlightRef.current = {
                      position: scaledPosition,
                      content: { image },
                    };
                    resetSelection();
                    renderHighlightLayers();
                  }
                )
              );
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PdfHighlighter;
