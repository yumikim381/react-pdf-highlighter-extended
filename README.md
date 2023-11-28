# react-pdf-highlighter-extended

`react-pdf-highlighter-extended` is a [React](https://reactjs.org/) library that provides a highly customisable annotation experience for PDF documents on the web, with text and rectangular highlights both supported. It leverages [PDF.js](https://github.com/mozilla/pdf.js) as its viewer. The highlight data format is also independent of the viewport, making it suitable for saving on a server.

This originally started as a fork of [`react-pdf-highlighter`](https://github.com/agentcooper/react-pdf-highlighter) but so much has been refactored and redesigned that it would be a burden to pull it to the original repo. Some of these changes include: addition of `HighlightUtils`, `TipViewerUtils`, `TipContainerUtils`, and `SelectionUtils`; zoom support; exposed styling on all components; and various bugfixes. Efforts will be made to try to ensure feature parity with the original repo, but there are no guarantees that syntax and usage will be the same.

## Table of Contents

- [Example](#example)
- [Installation](#installation)
- [Usage](#usage)
  - [PdfLoader](#pdfloader)
    - [Example loading document with `string`](#example-loading-document-with-string)
    - [Example loading document with `DocumentInitParameters`](#example-loading-document-with-documentinitparameters)
  - [PdfHighlighter](#pdfhighlighter)
    - [Example](#example-1)
  - [User-defined HighlightContainer](#user-defined-highlightcontainer)
    - [Example](#example-2)
    - [Example with `MonitoredHighlightContainer`](#example-with-monitoredhighlightcontainer)
    - [Example with categories](#example-with-categories)
  - [Tips](#tips)
    - [TipViewerUtils](#tipviewerutils)
    - [SelectionTip](#selectiontip)
    - [TipContainerUtils](#tipcontainerutils)
- [Contribute](#contribute)
- [Todo](#todo)

## Example

For a live demo check https://danielarnould.github.io/react-pdf-highlighter-extended/.

To run the example app locally:

```
git clone https://github.com/DanielArnould/react-pdf-highlighter-extended.git
npm install
npm run dev
```

## Installation

`npm install react-pdf-highlighter-extended --save`

## Usage

Here are some simple usage examples of this library to help you get started with your application. Please note that these examples and explanations are not exhaustive and many additional props are not shown. To see more extensive usage, have a look at the example app or refer to the library's docstrings.

### PdfLoader

The PdfLoader creates a safe container to load PDF documents with PDF.js

#### Example loading document with `string`

```javascript
const url = "https://arxiv.org/pdf/1708.08021.pdf";

<PdfLoader document={url}>
  {/* PdfHighlighter component goes here */}
</PdfLoader>;
```

#### Example loading document with `DocumentInitParameters`

You can also pass any extra parameters to the PdfLoader document that are accepted by PDF.js. For example, you could use this to specify HTTP headers for retrieving your document.

```javascript
const pdfDocument: Partial<DocumentInitParameters> = {
  url: "https://arxiv.org/pdf/1708.08021.pdf",
  httpHeaders: {
      "Authorization": "Bearer JWT_TOKEN_HERE"
  },
  password: "PDF_PASSWORD_HERE"
}

<PdfLoader document={pdfDocument}>
  {/* PdfHighlighter component goes here */}
</PdfLoader>
```

### PdfHighlighter

The PdfHighlighter provides a PDF.js viewer along with various helpful event listeners and niceties for creating a fully-fledged and robust highlighter. It does **NOT** render any highlights on its own, but it expects a user-defined Highlight Container as its child, which will be given context for individual highlights. Please also note for styling that the PDF.js viewer renders its pages with `absolute` positioning.

#### Example

```javascript
const myPdfHighlighter = () => {
  const [highlights, setHighlights] = useState<Array<Highlight>>([]);
  const scrollToRef = useRef<((highlight: Highlight) => void) | undefined>(
  undefined
  );

  const handleScrollAway = () => {
      // Event handler for whenever the
      // user scrolls away from an autoscrolled highlight (e.g., reset a url hash, change a ref, etc.)
  }

  return (
  <PdfLoader document={url}>
    <PdfHighlighter
        selectionTip={<ExpandableTip />}  // Component will render as a tip upon any selection
        highlights={highlights}
        enableAreaSelection={(event) => event.altKey}
        onScrollAway={handleScrollAway}
        scrollRef={(_scrollTo) => {
        scrollToRef.current = _scrollTo; // autoscroll function
        }}
    >
        {/* User-defined HighlightContainer component goes here */}
    </PdfHighlighter>
  </PdfLoader>
  )
}
```

### User-defined HighlightContainer

You must create your own Highlight Container which will be rendered as needed for each highlight inside the PdfHighlighter. This container will receive highlighting utilities through the `useHighlightUtils` hook. This library also provides two ready-to-use componenets, `TextHighlight` and `AreaHighlight`, which you can place inside your container to easily render some standard highlight styles.

#### Example

```javascript
interface MyHighlightContainerProps {
  editHighlight: (idToUpdate: string, edit: Partial<Highlight>) => void; // This could update highlights in the parent
}

const MyHighlightContainer = ({
  editHighlight,
}: MyHighlightContainerProps) => {

  const {
    highlight, // The highlight being rendered
    key, // If needed, use this key for rendering for most stable experience
    isSelectionInProgress, // Whether the user is making a text or mouse selection
    viewportToScaled, // Convert a highlight position to platform agnostic coords (useful for saving edits)
    screenshot, // Screenshot a bounding rectangle
    isScrolledTo, // Whether the highlight has been auto-scrolled to
    highlightBindings, // DOM references for the page and other highlights on it
  } = useHighlightUtils();

  const {
    currentTip,
    setTip,
    toggleEditInProgress,
    isEditInProgress
  } = useTipViewerUtils();

  const isTextHighlight = !Boolean(
    highlight.content && highlight.content.image
  );

  const component = isTextHighlight ? (
    <TextHighlight
      isScrolledTo={isScrolledTo}
      highlight={highlight}
    />
  ) : (
    <AreaHighlight
      isScrolledTo={isScrolledTo}
      highlight={highlight}
      onChange={(boundingRect) => {
        const edit = {
          position: {
            boundingRect: viewportToScaled(boundingRect),
            rects: [],
          },
          content: {
            image: screenshot(boundingRect),
          },
        };

        editHighlight(highlight.id, edit);
        toggleEditInProgress(false);
      }}
      bounds={highlightBindings.textLayer}
      onEditStart={() => toggleEditInProgress(true)}
    />
  );

  return (component);
};
```

#### Example with `MonitoredHighlightContainer`

Very often you might want to display a popup, tip, or comment if the user hovers over a highlight. To facilitate this, this library offers a `MonitoredHighlightContainer`, which you can wrap around your rendered highlight to create a mouse listener both over the highlight and any popup content you might display above it.

```javascript
const MyHighlightContainer = ({
  editHighlight,
}: MyHighlightContainerProps) => {

  // Same hooks as above example
  // Same logic as above example

  return (
    <MonitoredHighlightContainer
      popupContent={<HighlightPopup comment={highlight.comment} />} // User defined highlight popup
      onMouseOver={(popupContent) => { // Event called whenever user's mouse is over highlight or popup
        if (isSelectionInProgress()) return;

        const popupTip: Tip = {
          position: highlight.position,
          content: popupContent,
        };
        setTip(popupTip);
      }}
      onMouseOut={() => {
        setTip(null);
      }}
      key={key}
      children={component}
    />
  );
};
```

#### Example with categories

The power of a user-defined highlight container is that you can customise your highlight rendering as much as you want. For example, every highlight has a `Comment` attribute which can hold an optional `data` attribute. In your application, you could configure this to store a "category" property with some highlights

```javascript
const comment: Comment {
    text: "Comment text",
    data: {
        category: "red"
    }
}
```

You could then use this in your HighlightContainer to render highlights with different colors depending on their category.

```javascript
// Same logic as above examples

const category = highlight.comment.data?.category;
let highlightColor = "rgba(199,227,114,1)";

if (category === "red") {
  highlightColor = "rgba(239,90,104,1)";
} else if (category === "blue") {
  highlightColor = "rgba(154,208,220,1)";
}

const component = isTextHighlight ? (
  <TextHighlight highlight={highlight} style={{ background: highlightColor }} />
) : (
  <AreaHighlight
    highlight={highlight}
    style={{
      background: highlightColor,
    }}
  />
);

// Same return as above examples
```

### Tips

#### TipViewerUtils

Throughout your application you can access a PdfHighlighter's `TipViewerUtils`. Within any component inside a PdfHighlighter, this can be done with the `useTipViewerUtils` hook. If you want to access it outside the PdfHighlighter, you can use the `tipViewerUtilsRef` prop to create a dynamic reference to the latest set of tip utilities.

```javascript
<PdfLoader document={url}>
  <PdfHighlighter
    tipViewerUtilsRef={(_tipViewerUtils) => {
      tipViewerUtilsRef.current = _tipViewerUtils;
    }}
    highlights={highlights}
  ></PdfHighlighter>
</PdfLoader>
```

These allow you to customise the behaviour of tips inside the viewer. For example, you might use it to display a confirmation tip when deleting a highlight from a context menu, or you might use it to prevent other tips being shown when editing a highlight.

```javascript
export type TipViewerUtils = {
  /**
   * The current tip displayed in the viewer
   */
  currentTip: Tip | null;
  /**
   * Set a tip manually to be displayed in the PDF viewer or
   * set to `null` to hide any existing tip.
   */
  setTip: (tip: Tip | null) => void;
  /**
   * If enabled, automatic tips/popups inside of a PdfHighlighter will be disabled.
   * Additional niceties will also be provided to prevent new highlights being made.
   */
  toggleEditInProgress: (flag?: boolean) => void;
  /**
   * Whether an AreaHighlight is being moved/resized, or a manual highlight edit has
   * been toggled.
   */
  isEditInProgress: () => boolean;
};
```

#### SelectionTip

Very often you might want to display a tip above the user's text or mouse selection in a document. To achieve this, you can simply pass your own user-defined selection tip to the `selectionTip` prop in the PdfHighlighter. This componenet will also give you access to the `useSelectionUtils` hook which gives you some common functionalities regarding user selections.

```javascript
export type SelectionUtils = {
  /**
   * The platform-agnostic position of the user's current selection
   */
  selectionPosition: ScaledPosition;
  /**
   * What content, both text and visual, is currently contained inside the user's selection.
   */
  selectionContent: Content;
  /**
   * Cancel any ghost highlight.
   * The selected area will stay selected until the user clicks away.
   */
  removeGhostHighlight: () => void;
  /**
   * Convert the selected area into a temporary "locked" highlight.
   * This is useful if the user needs to fill a form after selecting an area
   * before making a highlight.
   */
  makeGhostHighlight: () => void;
};
```

```javascript
const MySelectionTip = () => {
  const {
    selectionPosition,
    selectionContent,
    removeGhostHighlight,
    makeGhostHighlight,
  } = useSelectionUtils();

  return (
    <div className="Tip">
      <button onClick={makeGhostHighlight}>Convert to Ghost Highlight</button>
    </div>
  );
};
```

#### TipContainerUtils

Any componenet set as a tip inside of the PdfHighlighter will get access to the `useTipContainerUtils` hook. A helpful feature of this is that it allows you to update a tip's positioning based on its size. This could be used, for example, to make sure a selection tip which expands after a button has been clicked stays above the user's selection.

```javascript
const MySelectionTip = () => {
  const [compact, setCompact] = useState(true);

  const {
    selectionPosition,
    selectionContent,
    removeGhostHighlight,
    makeGhostHighlight,
  } = useSelectionUtils();

  const { updatePosition } = useTipContainerUtils();

  useLayoutEffect(() => {
    updatePosition();
  }, [compact]);

  return (
    <div className="Tip">
      {compact ? (
        <button
          onClick={() => {
            setCompact(false);
            makeGhostHighlight();
          }}
        >
          Expand Tip
        </button>
      ) : (
        <div style={{ padding: "50px" }}>Expanded content</div>
      )}
    </div>
  );
};
```

## Contribute

If you have a bug to report, please add it as an issue with clear steps to reproduce it.

If you have a feature request, please add it as an issue or make a pull request. If you do wish to make a pull request, consider checking whether your feature has already been implemented or tested in the original [`react-pdf-highlighter`](https://github.com/agentcooper/react-pdf-highlighter).

## Todo

- [ ] Add selection copying
- [ ] Add multi-page mouse selection support
- [ ] Add search
- [ ] Add rotation
- [ ] Update PDF.js
