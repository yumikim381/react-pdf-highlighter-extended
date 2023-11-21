import React, { useContext } from "react";
import {
  AreaHighlight,
  MonitoredHighlightContainer,
  TextHighlight,
  Tip,
  useHighlightContext,
} from "./react-pdf-highlighter";
import HighlightPopup from "./HighlightPopup";

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
    index,
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
        const popupTip: Tip = {
          highlight,
          content: popupContent,
        };
        setTip(popupTip);
      }}
      onMouseOut={() => {
        hideTip();
      }}
      key={index}
      children={component}
    />
  );
};

export default HighlightRenderer;
