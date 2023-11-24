import { PDFDocumentProxy } from "pdfjs-dist";
import React, { useEffect, useRef, useState, MouseEvent } from "react";
import ExpandableTip from "./ExpandableTip";
import HighlightRenderer from "./HighlightRenderer";
import Sidebar from "./Sidebar";
import {
  Comment,
  Content,
  GhostHighlight,
  Highlight,
  PdfHighlighter,
  PdfLoader,
  ScaledPosition,
  ViewportHighlight,
} from "./react-pdf-highlighter";
import "./style/App.css";
import { testHighlights as _testHighlights } from "./test-highlights";
import ContextMenu, { ContextMenuProps } from "./ContextMenu";
import Toolbar from "./Toolbar";

const TEST_HIGHLIGHTS = _testHighlights;
const PRIMARY_PDF_URL = "https://arxiv.org/pdf/1708.08021.pdf";
const SECONDARY_PDF_URL = "https://arxiv.org/pdf/1604.02480.pdf";
const LARGE_PDF_URL = "https://arxiv.org/pdf/2210.04048.pdf";

const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () => {
  return document.location.hash.slice("#highlight-".length);
};

const resetHash = () => {
  document.location.hash = "";
};

const App = () => {
  const [url, setUrl] = useState(PRIMARY_PDF_URL);
  const [highlights, setHighlights] = useState<Array<Highlight>>(
    TEST_HIGHLIGHTS[PRIMARY_PDF_URL] ?? []
  );
  const currentPdfIndexRef = useRef(0);
  const scrollToRef = useRef<((highlight: Highlight) => void) | undefined>(
    undefined
  );

  const [contextMenu, setContextMenu] = useState<ContextMenuProps | null>(null);
  const [pdfScaleValue, setPdfScaleValue] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    const handleClick = () => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [contextMenu]);

  const handleContextMenu = (
    event: MouseEvent<HTMLDivElement>,
    highlight: ViewportHighlight
  ) => {
    event.preventDefault();

    setContextMenu({
      xPos: event.clientX,
      yPos: event.clientY,
      deleteHighlight: () => deleteHighlight(highlight),
      editComment: () => console.log("Edit comment!"),
    });
  };

  const resetHighlights = () => {
    setHighlights([]);
  };

  const toggleDocument = () => {
    const urls = [PRIMARY_PDF_URL, SECONDARY_PDF_URL, LARGE_PDF_URL];
    currentPdfIndexRef.current = (currentPdfIndexRef.current + 1) % urls.length;
    setUrl(urls[currentPdfIndexRef.current]);
    setHighlights(TEST_HIGHLIGHTS[urls[currentPdfIndexRef.current]] ?? []);
  };

  const getHighlightById = (id: string) => {
    return highlights.find((highlight) => highlight.id === id);
  };

  const scrollToHighlightFromHash = () => {
    const highlight = getHighlightById(parseIdFromHash());

    if (highlight && scrollToRef.current) {
      scrollToRef.current(highlight);
    }
  };

  useEffect(() => {
    window.addEventListener("hashchange", scrollToHighlightFromHash);

    return () => {
      window.removeEventListener("hashchange", scrollToHighlightFromHash);
    };
  }, [scrollToHighlightFromHash]);

  const addHighlight = (highlight: GhostHighlight, comment: Comment) => {
    console.log("Saving highlight", highlight);
    setHighlights([{ ...highlight, comment, id: getNextId() }, ...highlights]);
  };

  const deleteHighlight = (highlight: ViewportHighlight) => {
    console.log("Deleting highlight", highlight);
    setHighlights(highlights.filter((h) => h.id != highlight.id));
  };

  const updateHighlight = (
    id: string,
    position: Partial<ScaledPosition>,
    content: Partial<Content>
  ) => {
    console.log("Updating highlight", id, position, content);

    setHighlights(
      highlights.map((highlight) =>
        highlight.id === id
          ? {
              ...highlight,
              position: { ...highlight.position, ...position },
              content: { ...highlight.content, ...content },
            }
          : highlight
      )
    );
  };

  return (
    <div className="App" style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        highlights={highlights}
        resetHighlights={resetHighlights}
        toggleDocument={toggleDocument}
      />
      <div
        style={{
          height: "100vh",
          width: "75vw",
          position: "relative",
          flexGrow: 1,
        }}
      >
        <Toolbar
          setPdfScaleValue={(value) => setPdfScaleValue(value)}
          url={url}
        />
        <PdfLoader url={url}>
          {(pdfDocument: PDFDocumentProxy) => (
            <PdfHighlighter
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => event.altKey}
              onScrollAway={resetHash}
              scrollRef={(scrollTo) => {
                scrollToRef.current = scrollTo;
              }}
              pdfScaleValue={pdfScaleValue}
              selectionTip={<ExpandableTip addHighlight={addHighlight} />}
              highlights={highlights}
              style={{
                height: "calc(100% - 46px)",
              }}
            >
              <HighlightRenderer
                updateHighlight={updateHighlight}
                onContextMenu={handleContextMenu}
              />
            </PdfHighlighter>
          )}
        </PdfLoader>
      </div>
      {contextMenu && <ContextMenu {...contextMenu} />}
    </div>
  );
};

export default App;
