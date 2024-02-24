import React, { ReactElement, ReactNode, useRef } from "react";
import MouseMonitor from "./MouseMonitor";
import { usePdfHighlighterContext } from "../contexts/PdfHighlighterContext";
import { Tip } from "../types";

/**
 * The props type for {@link MonitoredHighlightContainer}.
 */
interface MonitoredHighlightContainerProps {
  /**
   * A callback triggered whenever the mouse hovers over a highlight.
   */
  onMouseEnter?: () => void;

  /**
   * The content to display in a popup. NOTE: This will not render the popupContent,
   * but it will monitor mouse activity over it
   */
  highlightTip?: Tip;

  /**
   * A callback triggered whenever the mouse completely moves out from both the popupContent
   * and highlight (children).
   */
  onMouseLeave?: () => void;

  /**
   * Container to monitor .
   */
  children: ReactElement;
}

/**
 * A container for a highlight component that monitors whether a mouse is over a highlight
 * and over some secondary/popup content. This does not render any popup/tip,
 * but it should ideally be used to set the visible state / rendering of a popup.
 */
const MonitoredHighlightContainer = ({
  onMouseEnter,
  highlightTip,
  onMouseLeave,
  children,
}: MonitoredHighlightContainerProps) => {
  const mouseInRef = useRef(false); // Whether the mouse is over the child (highlight)

  const { setTip, isEditingOrHighlighting } = usePdfHighlighterContext();

  return (
    <div
      onMouseEnter={() => {
        mouseInRef.current = true;
        onMouseEnter && onMouseEnter();
        if (isEditingOrHighlighting()) return;
        if (highlightTip) {
          setTip({
            position: highlightTip.position,
            content: (
              <MouseMonitor
                onMoveAway={() => {
                  if (mouseInRef.current) {
                    return;
                  }

                  setTip(null);
                  onMouseLeave && onMouseLeave();
                }}
                paddingX={60}
                paddingY={30}
              >
                {highlightTip.content}
              </MouseMonitor>
            ),
          });
        }
      }}
      onMouseLeave={() => {
        mouseInRef.current = false;
        !highlightTip && onMouseLeave && onMouseLeave();
      }}
    >
      {children}
    </div>
  );
};

export default MonitoredHighlightContainer;
