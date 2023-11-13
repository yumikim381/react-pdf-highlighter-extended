import debounce from "lodash.debounce";
import { PDFDocumentProxy } from "pdfjs-dist";
import { EventBus } from "pdfjs-dist/types/web/event_utils";
import { NullL10n } from "pdfjs-dist/types/web/l10n_utils";
import { PDFLinkService } from "pdfjs-dist/types/web/pdf_link_service";
import { PDFViewer } from "pdfjs-dist/types/web/pdf_viewer";
import React, { PointerEventHandler, useEffect, useRef, useState } from "react";
import { scaledToViewport, viewportToScaled } from "src/lib/coordinates";
import getAreaAsPng from "src/lib/get-area-as-png";
import { asElement, findOrCreateContainerLayer, getPagesFromRange, getWindow, isHTMLElement } from "src/lib/pdfjs-dom";
import {
  LTWHP,
  Scaled,
  LTWH,
  ScaledPosition,
  IHighlight,
  Position,
} from "src/types";
import TipContainer from "./TipContainer";
import getClientRects from "src/lib/get-client-rects";
import getBoundingRect from "src/lib/get-bounding-rect";

export type T_ViewportHighlight<T_HT> = { position: Position } & T_HT;

const EMPTY_ID = "empty-id";

interface Props<T_HT> {
  highlightTransform: (
    highlight: T_ViewportHighlight<T_HT>,
    index: number,
    setTip: (
      highlight: T_ViewportHighlight<T_HT>,
      callback: (highlight: T_ViewportHighlight<T_HT>) => JSX.Element
    ) => void,
    hideTip: () => void,
    viewportToScaled: (rect: LTWHP) => Scaled,
    screenshot: (position: LTWH) => string,
    isScrolledTo: boolean
  ) => JSX.Element;
  highlights: Array<T_HT>;
  onScrollChange: () => void;
  scrollRef: (scrollTo: (highlight: T_HT) => void) => void;
  pdfDocument: PDFDocumentProxy;
  pdfScaleValue: string;
  onSelectionFinished: (
    position: ScaledPosition,
    content: { text?: string; image?: string },
    hideTipAndSelection: () => void,
    transformSelection: () => void
  ) => JSX.Element | null;
  enableAreaSelection: (event: MouseEvent) => boolean;
}

const PdfHighlighter = <T_HT extends IHighlight>({
  highlightTransform,
  highlights,
  onScrollChange,
  scrollRef,
  pdfDocument,
  pdfScaleValue = "auto",
  onSelectionFinished,
  enableAreaSelection,
}: Props<T_HT>) => {
  const container = useRef<HTMLDivElement | null>(null);
  const viewer = useRef<PDFViewer | null>(null);
  const eventBus = useRef<EventBus>(new EventBus());
  const linkService = useRef<PDFLinkService>(
    new PDFLinkService({
      eventBus: eventBus.current,
      externalLinkTarget: 2,
    })
  );

  const handleScaleValue = () => {
    if (viewer?.current) {
      viewer.current.currentScaleValue = pdfScaleValue; //"page-width";
    }
  };

  const debouncedScaleValue = debounce(handleScaleValue, 500);
  const resizeObserver = useRef<ResizeObserver>(
    new ResizeObserver(debouncedScaleValue)
  );
  const [ghostHighlight, setGhostHighlight] = useState(null);
  const [tip, setTip] = useState<{
    highlight: T_ViewportHighlight<T_HT>;
    callback: (highlight: T_ViewportHighlight<T_HT>) => JSX.Element;
  } | null>(null);
  const [scrolledToHighlightId, setScrolledToHighlightId] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [range, setRange] = useState<Range | null>(null);
  const [isAreaSelectionInProgress, setIsAreaSelectionInProgress] =
    useState(false);
  const [tipPosition, setTipPosition] = useState<Position | null>(null);
  const [tipChildren, setTipChildren] = useState<React.JSX.Element | null>(
    null
  );

  useEffect(() => {
    if (!container?.current) return;

    eventBus.current.on("textlayerrendered", onTextLayerRendered);
    eventBus.current.on("pagesinit", onDocumentReady);
    container.current.addEventListener("selectionchange", onSelectionChange);
    container.current.addEventListener("keydown", handleKeyDown);
    container.current.ownerDocument.defaultView?.addEventListener(
      "resize",
      debouncedScaleValue
    );
    resizeObserver.current.observe(container.current);

    viewer.current = new PDFViewer({
      container: container.current,
      eventBus: eventBus.current,
      textLayerMode: 2,
      removePageBorders: true,
      linkService: linkService.current,
      l10n: NullL10n,
    });

    linkService.current.setDocument(pdfDocument);
    linkService.current.setViewer(viewer);
    viewer.current.setDocument(pdfDocument);

    return () => {
      if (!container?.current) return;

      eventBus.current.off("textlayerrendered", onTextLayerRendered);
      eventBus.current.off("pagesinit", onDocumentReady);
      container.current.removeEventListener(
        "selectionchange",
        onSelectionChange
      );
      container.current.removeEventListener("keydown", handleKeyDown);
      container.current.ownerDocument.defaultView?.removeEventListener(
        "resize",
        debouncedScaleValue
      );
      resizeObserver.current.disconnect();
    };
  }, []);

  const findOrCreateHighlightLayer = (page: number) => {
    if (!viewer.current) return;

    const { textLayer } = viewer.current.getPageView(page - 1) || {};

    if (!textLayer) {
      return null;
    }

    return findOrCreateContainerLayer(
      textLayer.div,
      "PdfHighlighter__highlight-layer"
    );
  };

  const groupHighlightsByPage = (
    highlights: Array<T_HT>
  ): {
    [pageNumber: string]: Array<T_HT>;
  } => {
    const allHighlights = [...highlights, ghostHighlight].filter(Boolean);

    const pageNumbers = new Set<number>();
    for (const highlight of allHighlights) {
      pageNumbers.add(highlight!.position.pageNumber);
      for (const rect of highlight!.position.rects) {
        if (rect.pageNumber) {
          pageNumbers.add(rect.pageNumber);
        }
      }
    }

    const groupedHighlights = {} as Record<number, any[]>;

    for (const pageNumber of pageNumbers) {
      groupedHighlights[pageNumber] = groupedHighlights[pageNumber] || [];
      for (const highlight of allHighlights) {
        const pageSpecificHighlight = {
          ...highlight,
          position: {
            pageNumber,
            boundingRect: highlight!.position.boundingRect,
            rects: [],
            usePdfCoordinates: highlight!.position.usePdfCoordinates,
          } as ScaledPosition,
        };
        let anyRectsOnPage = false;
        for (const rect of highlight!.position.rects) {
          if (
            pageNumber === (rect.pageNumber || highlight!.position.pageNumber)
          ) {
            pageSpecificHighlight.position.rects.push(rect);
            anyRectsOnPage = true;
          }
        }
        if (anyRectsOnPage || pageNumber === highlight!.position.pageNumber) {
          groupedHighlights[pageNumber].push(pageSpecificHighlight);
        }
      }
    }

    return groupedHighlights;
  };

  const showTip = (
    highlight: T_ViewportHighlight<T_HT>,
    content: JSX.Element
  ) => {
    const highlightInProgress = !isCollapsed || ghostHighlight;

    if (highlightInProgress || isAreaSelectionInProgress) {
      return;
    }

    setTipPosition(highlight.position);
    setTipChildren(content);
  };

  const hideTipAndSelection = () => {
    setTipPosition(null);
    setTipChildren(null);
    setGhostHighlight(null);
    setTip(null);
  };

  const scaledPositionToViewport = ({
    pageNumber,
    boundingRect,
    rects,
    usePdfCoordinates,
  }: ScaledPosition): Position | null => {
    if (!viewer.current) return null;
    const viewport = viewer.current.getPageView(pageNumber - 1).viewport;

    return {
      boundingRect: scaledToViewport(boundingRect, viewport, usePdfCoordinates),
      rects: (rects || []).map((rect) =>
        scaledToViewport(rect, viewport, usePdfCoordinates)
      ),
      pageNumber,
    };
  };

  const viewportPositionToScaled = ({
    pageNumber,
    boundingRect,
    rects,
  }: Position): ScaledPosition | null => {
    if (!viewer.current) return null;
    const viewport = viewer.current.getPageView(pageNumber - 1).viewport;

    return {
      boundingRect: viewportToScaled(boundingRect, viewport),
      rects: (rects || []).map((rect) => viewportToScaled(rect, viewport)),
      pageNumber,
    };
  };

  const screenshot = (position: LTWH, pageNumber: number) => {
    if (!viewer.current) return null;
    const canvas = viewer.current.getPageView(pageNumber - 1).canvas;

    return getAreaAsPng(canvas, position);
  };

  const renderTip = () => {
    if (!tipPosition || !viewer.current) return null;

    const { boundingRect, pageNumber } = tipPosition;
    const page = {
      node: viewer.current.getPageView(
        (boundingRect.pageNumber || pageNumber) - 1
      ).div,
      pageNumber: boundingRect.pageNumber || pageNumber,
    };

    const pageBoundingClientRect = page.node.getBoundingClientRect();

    const pageBoundingRect = {
      bottom: pageBoundingClientRect.bottom,
      height: pageBoundingClientRect.height,
      left: pageBoundingClientRect.left,
      right: pageBoundingClientRect.right,
      top: pageBoundingClientRect.top,
      width: pageBoundingClientRect.width,
      x: pageBoundingClientRect.x,
      y: pageBoundingClientRect.y,
      pageNumber: page.pageNumber,
    };

    return (
      <TipContainer
        scrollTop={viewer.current.container.scrollTop}
        pageBoundingRect={pageBoundingRect}
        style={{
          left:
            page.node.offsetLeft + boundingRect.left + boundingRect.width / 2,
          top: boundingRect.top + page.node.offsetTop,
          bottom: boundingRect.top + page.node.offsetTop + boundingRect.height,
        }}
      >
        {tipChildren}
      </TipContainer>
    );
  };

  const onTextLayerRendered = () => {
    renderHighlightLayers();
  };

  const scrollTo = (highlight: T_HT) => {
    if (!viewer.current) return;
    const { pageNumber, boundingRect, usePdfCoordinates } = highlight.position;

    viewer.current.container.removeEventListener("scroll", onScroll);

    const pageViewport = viewer.current.getPageView(pageNumber - 1).viewport;

    const scrollMargin = 10;

    viewer.current.scrollPageIntoView({
      pageNumber,
      destArray: [
        null,
        { name: "XYZ" },
        ...pageViewport.convertToPdfPoint(
          0,
          scaledToViewport(boundingRect, pageViewport, usePdfCoordinates).top -
            scrollMargin
        ),
        0,
      ],
    });

    setScrolledToHighlightId(highlight.id);

    // wait for scrolling to finish
    setTimeout(() => {
        if (!viewer.current) return;
      viewer.current.container.addEventListener("scroll", onScroll);
    }, 100);
  };

  const onDocumentReady = () => {
    handleScaleValue();
    scrollRef(scrollTo);
  };

  const onSelectionChange = () => {
    if (!container.current) return;
    const selection = getWindow(container.current).getSelection();

    if (!selection) {
      return;
    }

    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    if (selection.isCollapsed) {
      setIsCollapsed(true);
      return;
    }

    if (
      !range ||
      !container ||
      !container.current.contains(range.commonAncestorContainer)
    ) {
      return;
    }

    setIsCollapsed(false);
    setRange(range);
    debouncedAfterSelection();
  };

  const onScroll = () => {
    if (!viewer.current) return;
    onScrollChange();
    setScrolledToHighlightId(EMPTY_ID)
    renderHighlightLayers();
    viewer.current.container.removeEventListener("scroll", this.onScroll);
  };

  const onMouseDown: PointerEventHandler = (event) => {
    if (!isHTMLElement(event.target)) {
      return;
    }

    if (asElement(event.target).closest(".PdfHighlighter__tip-container")) {
      return;
    }

    hideTipAndSelection();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === "Escape") {
      hideTipAndSelection();
    }
  };

  const afterSelection = () => {
    if (!range || isCollapsed) {
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

    const viewportPosition: Position = {
      boundingRect,
      rects,
      pageNumber: pages[0].number,
    };

    const content = {
      text: range.toString(),
    };
    const scaledPosition = viewportPositionToScaled(viewportPosition);

    setTip({
        highlight: viewportPosition,
        callback: onSelectionFinished(
            scaledPosition,
            content,
            () => hideTipAndSelection(),
            () => setGhostHighlight({position: scaledPosition})
              this.setState(
                {
                  ghostHighlight: { position: scaledPosition },
                },
                () => this.renderHighlightLayers()
              )
          )
    })

    setTip(viewportPosition,
      onSelectionFinished(
        scaledPosition,
        content,
        () => this.hideTipAndSelection(),
        () =>
          this.setState(
            {
              ghostHighlight: { position: scaledPosition },
            },
            () => this.renderHighlightLayers()
          )
      )
    );
  };

  return <div ref={container}>PdfHighlighter</div>;
};
