import "pdfjs-dist/web/pdf_viewer.css";
import "../style/PdfHighlighter.css";
import "../style/pdf_viewer.css";

import debounce from "lodash.debounce";
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
import { usePdfLoaderContext } from "../contexts/PdfLoaderContext";
import { TipContext, TipUtils } from "../contexts/TipContext";
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

interface PdfHighlighterProps {
  highlights: Array<Highlight>;
  /**
   * Event is called only once whenever the user changes scroll after
   * the autoscroll function, scrollTo, has been called.
   */
  onScrollAway?: () => void;
  /**
   * Provides a reference to scrollTo,
   * to the parent which it can then use to make the PDF Viewer auto scroll
   * to a given highlight. The highlight context will also be notified of this
   * through the isScrolledTo property to allow for styling.
   *
   * Runs on every component render.
   *
   * @param scrollTo - Callback the parent component can use to make the PDF Viewer auto scroll to a highlight
   */
  scrollRef?: (scrollTo: (highlight: Highlight) => void) => void;
  /**
   * Provides a references to the current PDF.js viewer used by the PdfHighlighter.
   * This ideally shouldn't be used too much, but it allows the user to access
   * any extra PDF.js functionality or to make viewport calculations if they require.
   *
   * Runs on every component render.
   *
   * @param pdfViewer - The PDF.js viewer instance employed by the PdfHighligter.
   */
  pdfViewerRef?: (pdfViewer: PDFViewer) => void;
  pdfScaleValue?: PdfScaleValue;
  /**
   * Event listener for whenever a user finishes making an area selection or has selected text.
   *
   * @param event - Event data and utilities to convert selection into a ghost highlight.
   */
  onSelection?: (PdfSelection: PdfSelection) => void;
  onCreateGhostHighlight?: (ghostHighlight: GhostHighlight) => void;
  onRemoveGhostHighlight?: (ghostHighlight: GhostHighlight) => void;
  /**
   * Optional element that can be displayed as a tip whenever a user makes a selection.
   * This element will be provided an appropriate SelectionContext and can use
   * the useSelectionUtils hook.
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
  textSelectionColor?: string;
  /**
   * Style properties for the PdfHighlighter (scrollbar, background, etc.),
   * NOT the PDF.js viewer it encloses. If you want to edit the latter, use the other style props
   * like textSelectionColor or overwrite pdf_viewer.css
   */
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
  pdfViewerRef,
  pdfScaleValue = DEFAULT_SCALE_VALUE,
  onSelection: onSelectionFinished,
  onCreateGhostHighlight,
  onRemoveGhostHighlight,
  selectionTip,
  enableAreaSelection,
  mouseSelectionStyle,
  children,
  textSelectionColor = DEFAULT_TEXT_SELECTION_COLOR,
  style,
}: PdfHighlighterProps) => {
  const containerNodeRef = useRef<HTMLDivElement | null>(null);
  const { pdfDocument } = usePdfLoaderContext();

  // These are all refs because
  // 1. We need to use their updated states immediately
  // 2. HighlightLayers are manually rendered per page and thus unaffected by state
  const highlightBindingsRef = useRef<{ [page: number]: HighlightBindings }>(
    {},
  ); // Reference to highlight bindings per page
  const ghostHighlightRef = useRef<GhostHighlight | null>(null); // Reference to in-progress/temporary highlight
  const selectionRef = useRef<PdfSelection | undefined>(undefined);

  const scrolledToHighlightIdRef = useRef<string | null>(null); // Reference to the ID of the highlight autoscrolled to
  const isAreaSelectionInProgressRef = useRef(false); // Calculating AreaSelection content is expensive so we use this ref to prevent popups/tips when making a mouse selection
  const isEditInProgressRef = useRef(false);
  const [tip, setTip] = useState<Tip | null>(null);
  const tipUtilsRef = useRef<TipUtils>({
    currentTip: tip,
    setTip,
  });

  const [isViewerReady, setIsViewerReady] = useState(false);

  // These should only change when a document loads/unloads
  const eventBusRef = useRef<EventBus>(new EventBus());
  const linkServiceRef = useRef<PDFLinkService>(
    new PDFLinkService({
      eventBus: eventBusRef.current,
      externalLinkTarget: 2,
    }),
  );
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const viewerRef = useRef<PDFViewer | null>(null);

  const findOrCreateHighlightLayer = (textLayer: HTMLElement) => {
    return findOrCreateContainerLayer(
      textLayer,
      "PdfHighlighter__highlight-layer",
    );
  };

  // Init listeners
  useLayoutEffect(() => {
    resizeObserverRef.current = new ResizeObserver(handleScaleValue);
    if (!containerNodeRef.current) return;
    const doc = containerNodeRef.current.ownerDocument;

    resizeObserverRef.current.observe(containerNodeRef.current);

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

  // Initialise PDF Viewer
  useLayoutEffect(() => {
    if (!containerNodeRef.current) return;

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

    linkServiceRef.current.setDocument(pdfDocument);
    linkServiceRef.current.setViewer(viewerRef.current);
    viewerRef.current.setDocument(pdfDocument);
    setIsViewerReady(true);
  }, []);

  const isEditingOrHighlighting = () => {
    return (
      Boolean(selectionRef.current) ||
      Boolean(ghostHighlightRef.current) ||
      isAreaSelectionInProgressRef.current ||
      isEditInProgressRef.current
    );
  };

  const removeGhostHighlight = () => {
    if (onRemoveGhostHighlight && ghostHighlightRef.current)
      onRemoveGhostHighlight(ghostHighlightRef.current);
    ghostHighlightRef.current = null;
    renderHighlightLayers();
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

  const handleScroll = () => {
    if (onScrollAway) onScrollAway();
    scrolledToHighlightIdRef.current = null;
    renderHighlightLayers();
  };

  const handleSelectionChange = () => {
    const container = containerNodeRef.current;
    const selection = getWindow(container).getSelection();

    if (!container || !selection || selection.isCollapsed || !viewerRef.current)
      return;

    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    if (
      !range ||
      !container.contains(range.commonAncestorContainer) // Check the selected text is in the document, not the tip
    ) {
      return;
    }

    const pages = getPagesFromRange(range);
    if (!pages || pages.length === 0) return;

    const rects = getClientRects(range, pages);
    if (rects.length === 0) return;

    const boundingRect = getBoundingRect(rects);
    const viewportPosition: ViewportPosition = {
      boundingRect,
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
        if (onCreateGhostHighlight)
          onCreateGhostHighlight(ghostHighlightRef.current);
        clearTextSelection();
        renderHighlightLayers();
        return ghostHighlightRef.current;
      },
    };

    if (onSelectionFinished) onSelectionFinished(selectionRef.current);

    if (selectionTip)
      setTip({
        position: viewportPosition,
        content: selectionTip,
      });
  };

  const debouncedHandleSelectionChange = debounce(
    handleSelectionChange,
    SELECTION_DELAY,
  );

  const clearTextSelection = () => {
    selectionRef.current = undefined;

    const container = containerNodeRef.current;
    const selection = getWindow(container).getSelection();
    if (!container || !selection) return;
    selection.removeAllRanges();
  };

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

  const renderHighlightLayer = (
    highlightBindings: HighlightBindings,
    pageNumber: number,
  ) => {
    if (!viewerRef.current) return;

    highlightBindings.reactRoot.render(
      <PdfHighlighterContext.Provider value={pdfHighlighterUtils}>
        <TipContext.Provider value={tipUtilsRef.current}>
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
          ,
        </TipContext.Provider>
        ,
      </PdfHighlighterContext.Provider>,
    );
  };

  tipUtilsRef.current = { ...tipUtilsRef.current, currentTip: tip, setTip };

  const pdfHighlighterUtils: PdfHighlighterUtils = {
    isEditingOrHighlighting,
    getCurrentSelection: () => selectionRef.current,
    getGhostHighlight: () => ghostHighlightRef.current,
    removeGhostHighlight,
    toggleEditInProgress: (flag) => {
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
    },
    isEditInProgress: () => isEditInProgressRef.current,
    isSelectionInProgress: () =>
      Boolean(selectionRef.current) || isAreaSelectionInProgressRef.current,
  };

  // scrollRef && scrollRef(scrollToHighlight);
  // tipViewerUtilsRef && tipViewerUtilsRef(tipViewerUtils);
  // pdfViewerRef && viewerRef.current && pdfViewerRef(viewerRef.current);

  return (
    <PdfHighlighterContext.Provider value={pdfHighlighterUtils}>
      <TipContext.Provider value={tipUtilsRef.current}>
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
          {isViewerReady && <TipContainer viewer={viewerRef.current!} />}
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
                // console.log("onReset called!");
                selectionRef.current = undefined;
              }}
              onSelection={(
                viewportPosition,
                scaledPosition,
                image,
                resetSelection,
              ) => {
                console.log(scaledPosition);
                selectionRef.current = {
                  content: { image },
                  position: scaledPosition,
                  makeGhostHighlight: () => {
                    ghostHighlightRef.current = {
                      position: scaledPosition,
                      content: { image },
                    };
                    if (onCreateGhostHighlight)
                      onCreateGhostHighlight(ghostHighlightRef.current);
                    // console.log("Before onReset");
                    resetSelection();
                    renderHighlightLayers();
                    return ghostHighlightRef.current;
                  },
                };

                if (onSelectionFinished)
                  onSelectionFinished(selectionRef.current);

                if (selectionTip)
                  setTip({
                    position: viewportPosition,
                    content: selectionTip,
                  });
              }}
            />
          )}
        </div>
      </TipContext.Provider>
    </PdfHighlighterContext.Provider>
  );
};

export default PdfHighlighter;
