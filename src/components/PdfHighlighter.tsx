import "pdfjs-dist/web/pdf_viewer.css";
import "../style/PdfHighlighter.css";
import "../style/pdf_viewer.css";

import debounce from "lodash.debounce";
import { PDFDocumentProxy } from "pdfjs-dist";
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
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import {
  PdfHighlighterContext,
  PdfHighlighterUtils,
} from "../contexts/PdfHighlighterContext";
import { scaledToViewport, viewportPositionToScaled } from "../lib/coordinates";
import { disableTextSelection } from "../lib/disable-text-selection";
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
  Content,
  GhostHighlight,
  Highlight,
  HighlightBindings,
  PdfScaleValue,
  PdfSelection,
  Tip,
  ViewportPosition,
} from "../types";
import HighlightLayer from "./HighlightLayer";
import MouseSelection from "./MouseSelection";
import TipContainer from "./TipContainer";

const SCROLL_MARGIN = 10;
const SELECTION_DELAY = 250; // Debounce wait time in milliseconds for a selection changing to be registered
const DEFAULT_SCALE_VALUE = "auto";
const DEFAULT_TEXT_SELECTION_COLOR = "rgba(153,193,218,255)";

const findOrCreateHighlightLayer = (textLayer: HTMLElement) => {
  return findOrCreateContainerLayer(
    textLayer,
    "PdfHighlighter__highlight-layer",
  );
};

interface PdfHighlighterProps {
  highlights: Array<Highlight>;
  onScrollAway?: () => void;
  pdfScaleValue?: PdfScaleValue;
  onSelection?: (PdfSelection: PdfSelection) => void;
  onCreateGhostHighlight?: (ghostHighlight: GhostHighlight) => void;
  onRemoveGhostHighlight?: (ghostHighlight: GhostHighlight) => void;
  selectionTip?: ReactElement;
  enableAreaSelection?: (event: MouseEvent) => boolean;
  mouseSelectionStyle?: CSSProperties;
  pdfDocument: PDFDocumentProxy;
  children: ReactElement;
  textSelectionColor?: string;
  utilsRef: (pdfHighlighterUtils: PdfHighlighterUtils) => void;
  style?: CSSProperties;
}

const PdfHighlighter = ({
  highlights,
  onScrollAway,
  pdfScaleValue = DEFAULT_SCALE_VALUE,
  onSelection: onSelectionFinished,
  onCreateGhostHighlight,
  onRemoveGhostHighlight,
  selectionTip,
  enableAreaSelection,
  mouseSelectionStyle,
  pdfDocument,
  children,
  textSelectionColor = DEFAULT_TEXT_SELECTION_COLOR,
  utilsRef,
  style,
}: PdfHighlighterProps) => {
  // State
  const [tip, setTip] = useState<Tip | null>(null);
  const [isViewerReady, setIsViewerReady] = useState(false);

  // Refs
  const containerNodeRef = useRef<HTMLDivElement | null>(null);
  const highlightBindingsRef = useRef<{ [page: number]: HighlightBindings }>({});
  const ghostHighlightRef = useRef<GhostHighlight | null>(null); 
  const selectionRef = useRef<PdfSelection | null>(null);
  const scrolledToHighlightIdRef = useRef<string | null>(null);
  const isAreaSelectionInProgressRef = useRef(false);
  const isEditInProgressRef = useRef(false);
  const updateTipPositionRef = useRef(() => {});

  const eventBusRef = useRef<EventBus>(new EventBus());
  const linkServiceRef = useRef<PDFLinkService>(
    new PDFLinkService({
      eventBus: eventBusRef.current,
      externalLinkTarget: 2,
    }),
  );
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const viewerRef = useRef<PDFViewer | null>(null);



  // Initialise PDF Viewer
  useLayoutEffect(() => {
    if (!containerNodeRef.current) return;

    const debouncedDocumentInit = debounce(() => {
      viewerRef.current =
        viewerRef.current ||
        new PDFViewer({
          container: containerNodeRef.current!,
          eventBus: eventBusRef.current,
          textLayerMode: 2, // Needed to prevent flickering in Chrome. Known issue with PDF.js
          removePageBorders: true,
          linkService: linkServiceRef.current,
          l10n: NullL10n, // No localisation
        });
        
      viewerRef.current.setDocument(pdfDocument);
      linkServiceRef.current.setDocument(pdfDocument);
      linkServiceRef.current.setViewer(viewerRef.current);
      setIsViewerReady(true);
    }, 100);

    debouncedDocumentInit();

    return () => {
      debouncedDocumentInit.cancel();
    };
  }, [document]);

  // Initialise viewer event listeners
  useLayoutEffect(() => {
    if (!containerNodeRef.current) return;

    resizeObserverRef.current = new ResizeObserver(handleScaleValue);
    resizeObserverRef.current.observe(containerNodeRef.current);

    const doc = containerNodeRef.current.ownerDocument;

    eventBusRef.current.on("textlayerrendered", renderHighlightLayers);
    eventBusRef.current.on("pagesinit", handleScaleValue);
    doc.addEventListener("selectionchange", debouncedHandleSelectionChange);
    doc.addEventListener("keydown", handleKeyDown);

    renderHighlightLayers();

    return () => {
      eventBusRef.current.off("pagesinit", handleScaleValue);
      eventBusRef.current.off("textlayerrendered", renderHighlightLayers);
      doc.removeEventListener(
        "selectionchange",
        debouncedHandleSelectionChange,
      );
      doc.removeEventListener("keydown", handleKeyDown);
      resizeObserverRef.current?.disconnect();
    };
  }, [selectionTip, highlights, onSelectionFinished]);

  // Event listeners
  const handleScroll = () => {
    onScrollAway && onScrollAway();
    scrolledToHighlightIdRef.current = null;
    renderHighlightLayers();
  };

  const debouncedHandleSelectionChange = debounce(() => {
    const container = containerNodeRef.current;
    const selection = getWindow(container).getSelection();

    if (!container || !selection || selection.isCollapsed || !viewerRef.current)
      return;

    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    // Check the selected text is in the document, not the tip
    if (!range || !container.contains(range.commonAncestorContainer)) return;

    const pages = getPagesFromRange(range);
    if (!pages || pages.length === 0) return;

    const rects = getClientRects(range, pages);
    if (rects.length === 0) return;

    const viewportPosition: ViewportPosition = {
      boundingRect: getBoundingRect(rects),
      rects,
    };

    const scaledPosition = viewportPositionToScaled(
      viewportPosition,
      viewerRef.current,
    );

    const content: Content = {
      text: selection.toString().split("\n").join(" "), // Make all line breaks spaces
    };

    selectionRef.current = {
      content,
      position: scaledPosition,
      makeGhostHighlight: () => {
        ghostHighlightRef.current = {
          content: content,
          position: scaledPosition,
        };

        onCreateGhostHighlight && onCreateGhostHighlight(ghostHighlightRef.current);
        clearTextSelection();
        renderHighlightLayers();
        return ghostHighlightRef.current;
      },
    };

    onSelectionFinished && onSelectionFinished(selectionRef.current);

    selectionTip && setTip({position: viewportPosition, content: selectionTip});
  }, SELECTION_DELAY);

  const handleMouseDown: PointerEventHandler = (event) => {
    if (
      !isHTMLElement(event.target) ||
      asElement(event.target).closest(".PdfHighlighter__tip-container") // Ignore selections on tip container
    ) {
      return;
    }

    setTip(null);
    clearTextSelection(); // TODO: Check if clearing text selection only if not clicking on tip breaks anything.
    removeGhostHighlight();
    toggleEditInProgress(false);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === "Escape") {
      clearTextSelection();
      removeGhostHighlight();
      setTip(null);
    }
  };

  const handleScaleValue = () => {
    if (viewerRef.current) {
      viewerRef.current.currentScaleValue = pdfScaleValue.toString();
    }
  };

  // Render Highlight layers
  const renderHighlightLayer = (
    highlightBindings: HighlightBindings,
    pageNumber: number,
  ) => {
    if (!viewerRef.current) return;

    highlightBindings.reactRoot.render(
      <PdfHighlighterContext.Provider value={pdfHighlighterUtils}>
          <HighlightLayer
            highlightsByPage={groupHighlightsByPage([
              ...highlights,
              ghostHighlightRef.current,
            ])}
            pageNumber={pageNumber}
            scrolledToHighlightId={scrolledToHighlightIdRef.current}
            viewer={viewerRef.current}
            highlightBindings={highlightBindings}
            children={children}
          />
      </PdfHighlighterContext.Provider>,
    );
  };

  const renderHighlightLayers = () => {
    if (!viewerRef.current) return;

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
            pageNumber,
          );
        }
      }
    }
  };

  // Utils
  const isEditingOrHighlighting = () => {
    return (
      Boolean(selectionRef.current) ||
      Boolean(ghostHighlightRef.current) ||
      isAreaSelectionInProgressRef.current ||
      isEditInProgressRef.current
    );
  };

  const toggleEditInProgress = (flag?: boolean) => {
    if (flag !== undefined) {
      isEditInProgressRef.current = flag;
    } else {
      isEditInProgressRef.current = !isEditInProgressRef.current;
    }

    // Disable text selection
    if (viewerRef.current)
      viewerRef.current.viewer?.classList.toggle(
        "PdfHighlighter--disable-selection",
        isEditInProgressRef.current,
      );
  }

  const removeGhostHighlight = () => {
    if (onRemoveGhostHighlight && ghostHighlightRef.current)
      onRemoveGhostHighlight(ghostHighlightRef.current);
    ghostHighlightRef.current = null;
    renderHighlightLayers();
  };

  const clearTextSelection = () => {
    selectionRef.current = undefined;

    const container = containerNodeRef.current;
    const selection = getWindow(container).getSelection();
    if (!container || !selection) return;
    selection.removeAllRanges();
  };

  const scrollToHighlight = (highlight: Highlight) => {
    const { boundingRect, usePdfCoordinates } = highlight.position;
    const pageNumber = boundingRect.pageNumber;

    // Remove scroll listener in case user auto-scrolls in succession.
    viewerRef.current!.container.removeEventListener("scroll", handleScroll);

    const pageViewport = viewerRef.current!.getPageView(
      pageNumber - 1,
    ).viewport;

    viewerRef.current!.scrollPageIntoView({
      pageNumber,
      destArray: [
        null, // null since we pass pageNumber already as an arg
        { name: "XYZ" },
        ...pageViewport.convertToPdfPoint(
          0, // Default x coord
          scaledToViewport(boundingRect, pageViewport, usePdfCoordinates).top -
            SCROLL_MARGIN,
        ),
        0, // Default z coord
      ],
    });

    scrolledToHighlightIdRef.current = highlight.id;
    renderHighlightLayers();

    // wait for scrolling to finish
    setTimeout(() => {
      viewerRef.current!.container.addEventListener("scroll", handleScroll, {
        once: true,
      });
    }, 100);
  };

  const pdfHighlighterUtils: PdfHighlighterUtils = {
    isEditingOrHighlighting,
    getCurrentSelection: () => selectionRef.current,
    getGhostHighlight: () => ghostHighlightRef.current,
    removeGhostHighlight,
    toggleEditInProgress,
    isEditInProgress: () => isEditInProgressRef.current,
    isSelectionInProgress: () =>
      Boolean(selectionRef.current) || isAreaSelectionInProgressRef.current,
    scrollToHighlight,
    getViewer: () => viewerRef.current,
    getTip: () => tip,
    setTip,
    updateTipPosition: updateTipPositionRef.current
  };

  utilsRef(pdfHighlighterUtils);

  return (
    <PdfHighlighterContext.Provider value={pdfHighlighterUtils}>
        <div
          ref={containerNodeRef}
          className="PdfHighlighter"
          onPointerDown={handleMouseDown}
          style={style}
        >
          <div className="pdfViewer" />
          <style>
            {`
          .textLayer ::selection {
            background: ${textSelectionColor};
          }
        `}
          </style>
          {isViewerReady && <TipContainer viewer={viewerRef.current!} updateTipPositionRef={updateTipPositionRef} />}
          {isViewerReady && enableAreaSelection && (
            <MouseSelection
              viewer={viewerRef.current!}
              onChange={(isVisible) =>
                (isAreaSelectionInProgressRef.current = isVisible)
              }
              enableAreaSelection={enableAreaSelection}
              style={mouseSelectionStyle}
              onDragStart={() => disableTextSelection(viewerRef.current!, true)}
              onDragEnd={() => disableTextSelection(viewerRef.current!, false)}
              onReset={() => {
                selectionRef.current = null;
              }}
              onSelection={(
                viewportPosition,
                scaledPosition,
                image,
                resetSelection,
              ) => {
                selectionRef.current = {
                  content: { image },
                  position: scaledPosition,
                  makeGhostHighlight: () => {
                    ghostHighlightRef.current = {
                      position: scaledPosition,
                      content: { image },
                    };
                    onCreateGhostHighlight && onCreateGhostHighlight(ghostHighlightRef.current);
                    resetSelection();
                    renderHighlightLayers();
                    return ghostHighlightRef.current;
                  },
                };

                onSelectionFinished && onSelectionFinished(selectionRef.current);
                selectionTip && setTip({position: viewportPosition, content: selectionTip});
              }}
            />
          )}
        </div>
    </PdfHighlighterContext.Provider>
  );
};

export default PdfHighlighter;
