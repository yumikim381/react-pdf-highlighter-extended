import React, { MouseEvent, useEffect, useRef, useState } from "react";
import CommentForm from "./CommentForm";
import ContextMenu, { ContextMenuProps } from "./ContextMenu";
import ExpandableTip from "./ExpandableTip";
import HighlightContainer from "./HighlightContainer";
import Sidebar from "./Sidebar";
import Toolbar from "./Toolbar";
import {
  Comment,
  GhostHighlight,
  Highlight,
  PdfHighlighter,
  PdfLoader,
  Tip,
  ViewportHighlight,
} from "./react-pdf-highlighter-extended";
import "./style/App.css";
import { testHighlights as _testHighlights } from "./test-highlights";

const TEST_HIGHLIGHTS = _testHighlights;
const PRIMARY_PDF_URL = "https://arxiv.org/pdf/1708.08021.pdf";
const SECONDARY_PDF_URL = "https://arxiv.org/pdf/1604.02480.pdf";
const LONG_LOADING_PDF_URL =
  "https://cdn.filestackcontent.com/wcrjf9qPTCKXV3hMXDwK";

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
    TEST_HIGHLIGHTS[PRIMARY_PDF_URL] ?? [],
  );
  const currentPdfIndexRef = useRef(0);
  const [contextMenu, setContextMenu] = useState<ContextMenuProps | null>(null);
  const [pdfScaleValue, setPdfScaleValue] = useState<number | undefined>(
    undefined,
  );

  // Refs for PdfHighlighter utilities
  const scrollToRef = useRef<((highlight: Highlight) => void) | undefined>(
    undefined,
  );
  // const tipViewerUtilsRef = useRef<TipViewerUtils | undefined>(undefined);

  const toggleDocument = () => {
    const urls = [PRIMARY_PDF_URL, SECONDARY_PDF_URL, LONG_LOADING_PDF_URL];
    currentPdfIndexRef.current = (currentPdfIndexRef.current + 1) % urls.length;
    setUrl(urls[currentPdfIndexRef.current]);
    setHighlights(TEST_HIGHLIGHTS[urls[currentPdfIndexRef.current]] ?? []);
  };

  // Click listeners for context menu
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

  // const handleContextMenu = (
  //   event: MouseEvent<HTMLDivElement>,
  //   highlight: ViewportHighlight,
  // ) => {
  //   event.preventDefault();

  //   setContextMenu({
  //     xPos: event.clientX,
  //     yPos: event.clientY,
  //     deleteHighlight: () => deleteHighlight(highlight),
  //     editComment: () => editComment(highlight),
  //   });
  // };

  const addHighlight = (highlight: GhostHighlight, comment: Comment) => {
    console.log("Saving highlight", highlight);
    setHighlights([{ ...highlight, comment, id: getNextId() }, ...highlights]);
  };

  const deleteHighlight = (highlight: ViewportHighlight | Highlight) => {
    console.log("Deleting highlight", highlight);
    setHighlights(highlights.filter((h) => h.id != highlight.id));
  };

  const editHighlight = (idToUpdate: string, edit: Partial<Highlight>) => {
    console.log(`Editing highlight ${idToUpdate} with `, edit);
    setHighlights(
      highlights.map((highlight) =>
        highlight.id === idToUpdate ? { ...highlight, ...edit } : highlight,
      ),
    );
  };

  const resetHighlights = () => {
    setHighlights([]);
  };

  const getHighlightById = (id: string) => {
    return highlights.find((highlight) => highlight.id === id);
  };

  // // Open comment tip and update highlight with new user input
  // const editComment = (highlight: ViewportHighlight) => {
  //   if (!tipViewerUtilsRef.current) return;

  //   const editCommentTip: Tip = {
  //     position: highlight.position,
  //     content: (
  //       <CommentForm
  //         placeHolder={highlight.comment.text}
  //         onSubmit={(input) => {
  //           editHighlight(highlight.id, { comment: { text: input } });
  //           tipViewerUtilsRef.current!.setTip(null);
  //           tipViewerUtilsRef.current!.toggleEditInProgress(false);
  //         }}
  //       ></CommentForm>
  //     ),
  //   };

  //   tipViewerUtilsRef.current.setTip(editCommentTip);
  //   tipViewerUtilsRef.current.toggleEditInProgress(true);
  // };

  // Scroll to highlight based on hash in the URL
  const scrollToHighlightFromHash = () => {
    const highlight = getHighlightById(parseIdFromHash());

    if (highlight && scrollToRef.current) {
      scrollToRef.current(highlight);
    }
  };

  // Hash listeners for autoscrolling to highlights
  useEffect(() => {
    window.addEventListener("hashchange", scrollToHighlightFromHash);

    return () => {
      window.removeEventListener("hashchange", scrollToHighlightFromHash);
    };
  }, [scrollToHighlightFromHash]);

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
          overflow: "hidden",
          position: "relative",
          flexGrow: 1,
        }}
      >
        <Toolbar
          setPdfScaleValue={(value) => setPdfScaleValue(value)}
          url={url}
        />
        <PdfLoader document={url}>
          {(pdfDocument) => (
            <PdfHighlighter
              enableAreaSelection={(event) => event.altKey}
              pdfDocument={pdfDocument}
              onScrollAway={resetHash}
              scrollRef={(_scrollTo) => {
                scrollToRef.current = _scrollTo;
              }}
              // tipViewerUtilsRef={(_tipViewerUtils) => {
              //   tipViewerUtilsRef.current = _tipViewerUtils;
              // }}
              pdfScaleValue={pdfScaleValue}
              selectionTip={<ExpandableTip addHighlight={addHighlight} />}
              highlights={highlights}
              style={{
                height: "calc(100% - 45px)",
              }}
            >
              <HighlightContainer
                editHighlight={editHighlight}
                // onContextMenu={handleContextMenu}
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
