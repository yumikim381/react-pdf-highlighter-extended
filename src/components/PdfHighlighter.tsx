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
import { createRoot } from "react-dom/client";
import { SelectionContext, SelectionUtils } from "../contexts/SelectionContext";
import { TipViewerContext, TipViewerUtils } from "../contexts/TipContext";
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
import {
  Tip,
  Content,
  GhostHighlight,
  Highlight,
  HighlightBindings,
  PdfScaleValue,
  ViewportPosition,
} from "../types";
import HighlightLayer from "./HighlightLayer";
import MouseSelectionRenderer from "./MouseSelectionRenderer";
import TipRenderer from "./TipRenderer";

const SCROLL_MARGIN = 10;
const TIP_WAIT = 250; // Debounce wait time in milliseconds for a selection changing and a tip being displayed

type TextSelection = {
  range: Range | null;
  selection: Selection | null;
  text: string;
};

interface PdfHighlighterProps {
  highlights: Array<Highlight>;

  /**
   * Event is called only once whenever the user changes scroll after
   * the autoscroll function, scrollTo, has been called.
   */
  onScrollAway?: () => void;

  /**
   * Provides a reference function, scrollTo,
   * to the parent which it can then use to make the PDF Viewer auto scroll
   * to a given highlight. The highlight context will also be notified of this
   * through the isScrolledTo property to allow for styling.
   *
   * Runs on every document load and whenever props change.
   *
   * @param scrollTo - Callback the parent component can use to make the PDF Viewer auto scroll to a highlight
   */
  scrollRef?: (scrollTo: (highlight: Highlight) => void) => void;
  tipViewerUtilsRef?: (tipViewerUtils: TipViewerUtils) => void;
  pdfViewerRef?: (pdfViewer: PDFViewer) => void;

  /** PDF document to view. Designed to be provided by a PdfLoader */
  pdfDocument: PDFDocumentProxy;
  pdfScaleValue?: PdfScaleValue;

  /**
   * Event listener for whenever a user finishes making an area selection or has selected text.
   *
   * @param event - Event data and utilities to convert selection into a ghost highlight.
   */
  onSelectionFinished?: (event: SelectionUtils) => void;

  /**
   * Optional element that can be displayed as a tip whenever a user makes a selection.
   * This element will be provided an appropriate SelectionTipContext. See docs there
   * for more info.
   */
  selectionTip?: ReactElement;

  /**
   * The optional conditional for starting an area selection by mouse.
   * If not provided Area Selection will be disabled.
   */
  enableAreaSelection?: (event: MouseEvent) => boolean;
  mouseSelectionStyle?: CSSProperties;

  /**
   * This should be a HighlightRenderer of some sorts. It will be given
   * appropriate context for a single highlight which it can then use to
   * render a TextHighlight, AreaHighlight, etc. in the correct place.
   */
  children: ReactElement;

  // TODO: DOCUMENT
  style?: CSSProperties;
}

/**
 * This is a large-scale PDF viewer component designed to facilitate highlighting.
 * It should be used as a child to a PdfLoader to ensure proper document loading.
 * This does not handle rendering of highlights, but it can provide a HighlightContext
 * to a HighlightRenderer for each highlight per page per document with capabilities
 * to generate tips. However, this does handle text selection and (optionally) area selection.
 */
const PdfHighlighter = ({
  highlights,
  onScrollAway,
  scrollRef,
  tipViewerUtilsRef,
  pdfViewerRef,
  pdfDocument,
  pdfScaleValue = "auto",
  onSelectionFinished,
  selectionTip,
  enableAreaSelection,
  mouseSelectionStyle,
  children,
  style,
}: PdfHighlighterProps) => {
  const containerNodeRef = useRef<HTMLDivElement | null>(null);

  // These are all refs because
  // 1. We need to use their updated states immediately
  // 2. HighlightLayers are manually rendered per page and thus unaffected by state
  const highlightBindingsRef = useRef<{ [page: number]: HighlightBindings }>(
    {}
  ); // Reference to highlight bindings per page
  const ghostHighlightRef = useRef<GhostHighlight | null>(null); // Reference to in-progress highlight (after "Add Highlight is selected")
  const textSelectionRef = useRef<TextSelection>({
    selection: null,
    range: null,
    text: "",
  });
  const scrolledToHighlightIdRef = useRef<string | null>(null); // Reference to the ID of the highlight autoscrolled to
  const isAreaSelectionInProgressRef = useRef(false);
  const isEditInProgressRef = useRef(false);

  const [currentTip, setTip] = useState<Tip | null>(null);

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

  const findOrCreateHighlightLayer = (textLayer: HTMLElement) => {
    return findOrCreateContainerLayer(
      textLayer,
      "PdfHighlighter__highlight-layer"
    );
  };

  // Initialise PDF Viewer
  useEffect(() => {
    const doc = containerNodeRef.current?.ownerDocument;
    if (!doc || !containerNodeRef.current) return;

    viewerRef.current =
      viewerRef.current ||
      new PDFViewer({
        container: containerNodeRef.current!,
        eventBus: eventBusRef.current,
        textLayerMode: 2, // EnablePermissions (i.e., don't allow selecting if PDF prevents it)
        removePageBorders: true,
        linkService: linkServiceRef.current,
        l10n: NullL10n, // No localisation
      });

    linkServiceRef.current.setDocument(pdfDocument);
    linkServiceRef.current.setViewer(viewerRef.current);
    viewerRef.current.setDocument(pdfDocument);

    setViewerReady(true);

    return () => {
      setViewerReady(false);
    };
  }, []);

  // Intiialise listeners
  useEffect(() => {
    resizeObserverRef.current = new ResizeObserver(handleScaleValue);
    const doc = containerNodeRef.current?.ownerDocument;
    if (!doc || !containerNodeRef.current) return;

    resizeObserverRef.current.observe(containerNodeRef.current);

    eventBusRef.current.on("textlayerrendered", renderHighlightLayers);
    eventBusRef.current.on("pagesinit", handleDocumentReady);
    doc.addEventListener("selectionchange", handleSelectionChange);
    doc.addEventListener("keydown", handleKeyDown);

    renderHighlightLayers();

    return () => {
      eventBusRef.current.off("pagesinit", handleDocumentReady);
      eventBusRef.current.off("textlayerrendered", renderHighlightLayers);
      doc.removeEventListener("selectionchange", handleSelectionChange);
      doc.removeEventListener("keydown", handleKeyDown);
      resizeObserverRef.current?.disconnect();
    };
  }, [selectionTip, highlights, onSelectionFinished]);

  const isTextSelectionEmpty = () => {
    return (
      !textSelectionRef.current ||
      textSelectionRef.current.selection?.isCollapsed ||
      !textSelectionRef.current.range ||
      !textSelectionRef.current.text
    );
  };

  const isSelectionInProgress = () => {
    return (
      !isTextSelectionEmpty() ||
      Boolean(ghostHighlightRef.current) ||
      isAreaSelectionInProgressRef.current ||
      isEditInProgressRef.current
    );
  };

  const removeGhostHighlight = () => {
    ghostHighlightRef.current = null;
    renderHighlightLayers();
  };

  const scrollTo = (highlight: Highlight) => {
    const { boundingRect, usePdfCoordinates } = highlight.position;
    const pageNumber = boundingRect.pageNumber;

    // Remove scroll listener in case user auto-scrolls in succession.
    onScrollAway &&
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
      onScrollAway &&
        viewerRef.current!.container.addEventListener("scroll", handleScroll, {
          once: true,
        });
    }, 100);
  };

  const handleDocumentReady = () => {
    handleScaleValue();
  };

  const handleSelectionChange = () => {
    const container = containerNodeRef.current;
    const selection = getWindow(container).getSelection();

    if (!container || !selection || selection.isCollapsed) return;

    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    if (
      !range ||
      !container.contains(range.commonAncestorContainer) // Check the selected text is in the document, not the tip
    ) {
      return;
    }

    textSelectionRef.current = {
      selection,
      range,
      text: selection.toString().split("\n").join(" "), // Make all line breaks spaces
    };

    debouncedAfterSelection();
  };

  const handleScroll = () => {
    onScrollAway!();
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

    setTip(null);
    removeGhostHighlight();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === "Escape") {
      // hideTipAndGhostHighlight();
      renderHighlightLayers();
    }
  };

  const afterSelection = () => {
    const { selection, range, text } = textSelectionRef.current;

    if (!range || selection?.isCollapsed) {
      return;
    }

    const pages = getPagesFromRange(range);
    if (!pages || pages.length === 0) {
      return;
    }

    const rects = getClientRects(range, pages);
    if (rects.length === 0) {
      return;
    }

    const boundingRect = getBoundingRect(rects);
    const viewportPosition: ViewportPosition = {
      boundingRect,
      rects,
    };

    const content: Content = { text };
    const scaledPosition = viewportPositionToScaled(
      viewportPosition,
      viewerRef.current!
    );

    const selectionUtils: SelectionUtils = {
      selectionPosition: scaledPosition,
      selectionContent: content,
      removeGhostHighlight,
      makeGhostHighlight: () => {
        ghostHighlightRef.current = {
          content: content,
          position: scaledPosition,
        };
        renderHighlightLayers();
      },
    };

    if (onSelectionFinished) onSelectionFinished(selectionUtils);

    if (selectionTip) {
      const newTip: Tip = {
        position: viewportPosition,
        content: (
          <SelectionContext.Provider value={selectionUtils}>
            {selectionTip}
          </SelectionContext.Provider>
        ),
      };

      setTip(newTip);
    }
  };

  const debouncedAfterSelection = debounce(afterSelection, TIP_WAIT);

  const handleScaleValue = () => {
    if (viewerRef.current) {
      viewerRef.current.currentScaleValue = pdfScaleValue.toString();
    }
  };

  const renderHighlightLayers = () => {
    console.log(
      "Render highlight layers called!",
      viewerRef.current?.currentScaleValue
    );

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
      const highlightBindings = highlightBindingsRef.current[pageNumber];

      // Need to check if container is still attached to the DOM as PDF.js can unload pages.
      if (highlightBindings?.container?.isConnected) {
        renderHighlightLayer(highlightBindings, pageNumber);
      } else {
        const { textLayer } =
          viewerRef.current!.getPageView(pageNumber - 1) || {};
        if (!textLayer) continue; // Viewer hasn't rendered page yet

        const highlightLayer = findOrCreateHighlightLayer(textLayer.div);

        if (highlightLayer) {
          const reactRoot = createRoot(highlightLayer);
          highlightBindingsRef.current[pageNumber] = {
            reactRoot,
            container: highlightLayer,
            textLayer: textLayer.div,
          };

          renderHighlightLayer(
            highlightBindingsRef.current[pageNumber],
            pageNumber
          );
        }
      }
    }
  };

  const renderHighlightLayer = (
    highlightBindings: HighlightBindings,
    pageNumber: number
  ) => {
    if (!viewerRef.current) return;

    highlightBindings.reactRoot.render(
      <TipViewerContext.Provider value={tipViewerUtils}>
        <HighlightLayer
          highlightsByPage={groupHighlightsByPage([
            ...highlights,
            ghostHighlightRef.current,
          ])}
          pageNumber={pageNumber}
          isSelectionInProgress={isSelectionInProgress}
          scrolledToHighlightId={scrolledToHighlightIdRef.current}
          viewer={viewerRef.current}
          highlightBindings={highlightBindings}
          children={children}
        />
      </TipViewerContext.Provider>
    );
  };

  const tipViewerUtils = { currentTip, setTip, isEditInProgressRef };

  scrollRef && scrollRef(scrollTo);
  tipViewerUtilsRef && tipViewerUtilsRef(tipViewerUtils);
  pdfViewerRef && viewerRef.current && pdfViewerRef(viewerRef.current);

  return (
    <>
      <div
        ref={containerNodeRef}
        className="PdfHighlighter"
        onPointerDown={handleMouseDown}
        style={style}
      >
        <div className="pdfViewer" />
        <TipViewerContext.Provider value={tipViewerUtils}>
          {isViewerReady && <TipRenderer viewer={viewerRef.current!} />}
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
                const selectionUtils: SelectionUtils = {
                  selectionPosition: scaledPosition,
                  selectionContent: { image },
                  removeGhostHighlight,
                  makeGhostHighlight: () => {
                    ghostHighlightRef.current = {
                      position: scaledPosition,
                      content: { image },
                    };
                    resetSelection();
                    renderHighlightLayers();
                  },
                };

                if (onSelectionFinished) onSelectionFinished(selectionUtils);

                if (selectionTip) {
                  const newTip: Tip = {
                    position: viewportPosition,
                    content: (
                      <SelectionContext.Provider value={selectionUtils}>
                        {selectionTip}
                      </SelectionContext.Provider>
                    ),
                  };

                  setTip(newTip);
                }
              }}
            />
          )}
        </TipViewerContext.Provider>
      </div>
    </>
  );
};

export default PdfHighlighter;
