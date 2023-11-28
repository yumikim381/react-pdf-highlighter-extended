# 7.0.0

- Exposed pdfScaleValue as a stateful prop
- Made all components functional based
- Updated PDF.js dependency to 3.8.162
- Added onContextMenu event listeners to Highlight components
- Fixed clamping bug / tips not being displayed correctly on ultrawide monitors
- Exposed styling on all componenets
- Added default dark grey background to PdfHighlighter
- Removed generic types for Highlight and added GhostHighlight as a public type.
- Exposed selection color styling and changed default color to blue.
- Replaced callbacks for afterSelection with selectionTip prop and onSelectionFinished events.
- Created `useHighlightUtils`, `useTipContainerUtils`, `useTipViewerUtils`, and `useSelectionUtils` hooks.
- Removed callbacks for rendering highlights in PdfHighlighter and instead replaced it with expecting a user-defined HighlightContainer which will be supplied `useHighlightUtils`
- Expoed `viewer` and `tipViewerUtils` as optionl reference callbacks in the PdfHighlighter. This allows more customisable control of displaying tips or accessing PDF.js settings
- Changed PdfLoader props to accept document parameters inside of `document`. Also added `onProgressParameters` as a variable to `beforeLoad`
- Added option to specify bounds for AreaHighlight, defaulted to the page in the example app.
- Added documentation to almost all components
- **Lots** of refactoring.

# 6.0.0

- Support for React 18 (https://github.com/agentcooper/react-pdf-highlighter/pull/232)
- Fix for `usePdfCoordinates` (https://github.com/agentcooper/react-pdf-highlighter/pull/244)

# 5.3.0

- [Added support of multi-page highlights](https://github.com/agentcooper/react-pdf-highlighter/pull/167), thanks to @jonathanbyrne!

# 3.0.0

- Update PDF.js dependency to 2.2.228.

# 2.1.1

- Enabled hyperlinks inside the PDF document (thanks @steevn).

# 2.0.0

- Renamed `PdfAnnotator` to `PdfHighlighter` all over the code for naming consistency.
