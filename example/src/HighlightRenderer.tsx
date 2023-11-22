import React from "react";
import HighlightPopup from "./HighlightPopup";
import {
  AreaHighlight,
  HighlightTip,
  MonitoredHighlightContainer,
  TextHighlight,
  useHighlightContext,
} from "./react-pdf-highlighter";

interface HighlightRendererProps {
  updateHighlight: (
    highlightId: string,
    position: Object,
    content: Object
  ) => void;
}

const HighlightRenderer = ({ updateHighlight }: HighlightRendererProps) => {
  const {
    highlight,
    key,
    setTip,
    hideTip,
    viewportToScaled,
    screenshot,
    isScrolledTo,
  } = useHighlightContext();

  const isTextHighlight = !Boolean(
    highlight.content && highlight.content.image
  );

  const component = isTextHighlight ? (
    <TextHighlight isScrolledTo={isScrolledTo} position={highlight.position} />
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
