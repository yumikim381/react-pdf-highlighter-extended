import React, { MouseEvent } from "react";
import HighlightPopup from "./HighlightPopup";
import {
  AreaHighlight,
  Highlight,
  MonitoredHighlightContainer,
  TextHighlight,
  Tip,
  ViewportHighlight,
  useHighlightContainerContext,
  usePdfHighlighterContext,
  useTipContext,
} from "./react-pdf-highlighter-extended";

interface HighlightContainerProps {
  editHighlight: (idToUpdate: string, edit: Partial<Highlight>) => void;
  onContextMenu?: (
    event: MouseEvent<HTMLDivElement>,
    highlight: ViewportHighlight,
  ) => void;
}

const HighlightContainer = ({
  editHighlight,
  onContextMenu,
}: HighlightContainerProps) => {
  const {
    highlight,
    viewportToScaled,
    screenshot,
    isScrolledTo,
    highlightBindings,
  } = useHighlightContainerContext();

  const { toggleEditInProgress, isEditingOrHighlighting } =
    usePdfHighlighterContext();

  const { setTip } = useTipContext();

  const isTextHighlight = !Boolean(
    highlight.content && highlight.content.image,
  );

  const component = isTextHighlight ? (
    <TextHighlight
      isScrolledTo={isScrolledTo}
      highlight={highlight}
      onContextMenu={(event) =>
        onContextMenu && onContextMenu(event, highlight)
      }
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
      onContextMenu={(event) =>
        onContextMenu && onContextMenu(event, highlight)
      }
      onEditStart={() => toggleEditInProgress(true)}
    />
  );

  return (
    <MonitoredHighlightContainer
      popupContent={<HighlightPopup comment={highlight.comment} />}
      onMouseOver={(popupContent) => {
        if (isEditingOrHighlighting()) return;

        const popupTip: Tip = {
          position: highlight.position,
          content: popupContent,
        };
        setTip(popupTip);
      }}
      onMouseOut={() => {
        setTip(null);
      }}
      key={highlight.id}
      children={component}
    />
  );
};

export default HighlightContainer;
