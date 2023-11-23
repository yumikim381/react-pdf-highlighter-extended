import { PDFDocumentProxy } from "pdfjs-dist";
import React, { useEffect, useRef, useState } from "react";
import ExpandableTip from "./ExpandableTip";
import HighlightRenderer from "./HighlightRenderer";
import {
  Comment,
  Content,
  GhostHighlight,
  Highlight,
  PdfHighlighter,
  PdfLoader,
  PdfScaleValue,
  ScaledPosition,
} from "./react-pdf-highlighter";
import "./style/App.css";
import { testHighlights as _testHighlights } from "./test-highlights";
import Sidebar from "./Sidebar";

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

  const updateHighlight = (
    id: string,
    position: Partial<ScaledPosition>,
    content: Partial<Content>
  ) => {
    console.log("Updating highlight", id, position, content);

    // DOESN'T RENDER FAST ENOUGH!!!

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

  // function getRandomValue(list: Array<PdfScaleValue>) {
  //   // Generate a random index
  //   const randomIndex = Math.floor(Math.random() * list.length);

  //   // Return the value at the random index
  //   return list[randomIndex];
  // }

  // // Example usage
  // const randomValue = getRandomValue(["auto", 1, 2, 3, 4]);
  // console.log(randomValue);

  return (
    <div
      className="App"
      style={{ display: "flex", height: "100vh", backgroundColor: "#333" }}
    >
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
        }}
      >
        <PdfLoader url={url}>
          {(pdfDocument: PDFDocumentProxy) => (
            <PdfHighlighter
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => event.altKey}
              onScrollAway={resetHash}
              // pdfScaleValue={randomValue}
              scrollRef={(scrollTo) => {
                scrollToRef.current = scrollTo;
              }}
              selectionTip={<ExpandableTip addHighlight={addHighlight} />}
              highlights={highlights}
            >
              <HighlightRenderer updateHighlight={updateHighlight} />
            </PdfHighlighter>
          )}
        </PdfLoader>
      </div>
    </div>
  );
};

export default App;
