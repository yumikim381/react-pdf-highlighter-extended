import React, { MouseEvent } from "react";
import HighlightPopup from "./HighlightPopup";
import {
  AreaHighlight,
  Highlight,
  HighlightTip,
  MonitoredHighlightContainer,
  TextHighlight,
  ViewportHighlight,
  useHighlightContext,
} from "./react-pdf-highlighter";

interface HighlightRendererProps {
  updateHighlight: (
    highlightId: string,
    position: Object,
    content: Object
  ) => void;
  onContextMenu?: (
    event: MouseEvent<HTMLDivElement>,
    highlight: ViewportHighlight
  ) => void;
}

const HighlightRenderer = ({
  updateHighlight,
  onContextMenu,
}: HighlightRendererProps) => {
  const {
    highlight,
    key,
    setTip,
    hideTip,
    viewportToScaled,
    screenshot,
    isScrolledTo,
    highlightBindings,
  } = useHighlightContext();

  const isTextHighlight = !Boolean(
    highlight.content && highlight.content.image
  );

  const component = isTextHighlight ? (
    <TextHighlight
      isScrolledTo={isScrolledTo}
      position={highlight.position}
      onContextMenu={(event) =>
        onContextMenu && onContextMenu(event, highlight)
      }
    />
  ) : (
    <AreaHighlight
      isScrolledTo={isScrolledTo}
      highlight={highlight}
      onChange={(boundingRect) => {
        updateHighlight(
          highlight.id,
          { boundingRect: viewportToScaled(boundingRect) },
          { image: screenshot(boundingRect) }
        );
      }}
      bounds={highlightBindings.textLayer}
      onContextMenu={(event) =>
        onContextMenu && onContextMenu(event, highlight)
      }
    />
  );

  return (
    <MonitoredHighlightContainer
      popupContent={<HighlightPopup comment={highlight.comment} />}
      onMouseOver={(popupContent) => {
        const popupTip: HighlightTip = {
          highlight,
          content: popupContent,
        };
        setTip(popupTip);
      }}
      onMouseOut={() => {
        hideTip();
      }}
      key={key}
      children={component}
    />
  );
};

export default HighlightRenderer;
