import React, { Component } from "react";

import {
  PdfLoader,
  PdfHighlighter,
  TextHighlight,
  AreaHighlight,
  MonitoredHighlightContainer,
} from "./react-pdf-highlighter";

import type {
  Comment,
  Highlight,
  GhostHighlight,
  NameThis2,
} from "./react-pdf-highlighter";

import { testHighlights as _testHighlights } from "./test-highlights";
import { Spinner } from "./Spinner";
import { Sidebar } from "./Sidebar";

import "./style/App.css";
import { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import HighlightRenderer from "./HighlightRenderer";
import ExpandableTip from "./ExpandableTip";

const testHighlights: Record<string, Array<Highlight>> = _testHighlights;

interface State {
  url: string;
  highlights: Array<Highlight>;
}

const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () =>
  document.location.hash.slice("#highlight-".length);

const resetHash = () => {
  document.location.hash = "";
};

const PRIMARY_PDF_URL = "https://arxiv.org/pdf/1708.08021.pdf";
const SECONDARY_PDF_URL = "https://arxiv.org/pdf/1604.02480.pdf";
const LARGE_PDF_URL = "https://arxiv.org/pdf/2210.04048.pdf";

const searchParams = new URLSearchParams(document.location.search);

const initialUrl = searchParams.get("url") || PRIMARY_PDF_URL;

class App extends Component<{}, State> {
  state = {
    url: initialUrl,
    highlights: testHighlights[initialUrl]
      ? [...testHighlights[initialUrl]]
      : [],
  };

  resetHighlights = () => {
    this.setState({
      highlights: [],
    });
  };

  toggleDocument = () => {
    const newUrl =
      this.state.url === PRIMARY_PDF_URL ? SECONDARY_PDF_URL : PRIMARY_PDF_URL;

    this.setState({
      url: newUrl,
      highlights: testHighlights[newUrl] ? [...testHighlights[newUrl]] : [],
    });
  };

  scrollViewerTo = (highlight: any) => {};

  scrollToHighlightFromHash = () => {
    const highlight = this.getHighlightById(parseIdFromHash());

    if (highlight) {
      console.log("Scroll viewer to!");
      this.scrollViewerTo(highlight);
    }
  };

  componentDidMount() {
    window.addEventListener(
      "hashchange",
      this.scrollToHighlightFromHash,
      false
    );
  }

  getHighlightById(id: string) {
    const { highlights } = this.state;

    return highlights.find((highlight) => highlight.id === id);
  }

  addHighlight(highlight: GhostHighlight, comment: Comment) {
    const { highlights } = this.state;

    console.log("Saving highlight", highlight);

    this.setState({
      highlights: [{ ...highlight, comment, id: getNextId() }, ...highlights],
    });
  }

  updateHighlight(highlightId: string, position: Object, content: Object) {
    console.log("Updating highlight", highlightId, position, content);

    this.setState({
      highlights: this.state.highlights.map((h) => {
        const {
          id,
          position: originalPosition,
          content: originalContent,
          ...rest
        } = h;
        return id === highlightId
          ? {
              id,
              position: { ...originalPosition, ...position },
              content: { ...originalContent, ...content },
              ...rest,
            }
          : h;
      }),
    });
  }

  render() {
    const { url, highlights } = this.state;

    // const vals = ["2", "auto", "1"];
    // const pdfScaleValue = vals[Math.floor(Math.random() * vals.length)];
    // console.log(pdfScaleValue);

    return (
      <div className="App" style={{ display: "flex", height: "100vh" }}>
        <Sidebar
          highlights={highlights}
          resetHighlights={this.resetHighlights}
          toggleDocument={this.toggleDocument}
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
                onScrollChange={resetHash}
                pdfScaleValue={2}
                scrollRef={(scrollTo) => {
                  this.scrollViewerTo = scrollTo;

                  this.scrollToHighlightFromHash();
                }}
                selectionTip={
                  <ExpandableTip addHighlight={this.addHighlight.bind(this)} />
                }
                highlights={highlights}
              >
                <HighlightRenderer
                  updateHighlight={this.updateHighlight.bind(this)}
                />
              </PdfHighlighter>
            )}
          </PdfLoader>
        </div>
      </div>
    );
  }
}

export default App;
