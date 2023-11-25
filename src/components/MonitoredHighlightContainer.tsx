import React, { ReactElement, useRef } from "react";
import MouseMonitor from "./MouseMonitor";

interface MonitoredHighlightContainerProps {
  /**
   * A callback function to execute when the mouse hovers over the children/highlight.
   * Can be used for triggering popup renders.
   *
   * @param monitoredPopupContent - The content to display in a popup.
   */
  onMouseOver: (monitoredPopupContent: ReactElement) => void;
  /**
   * The content to display in a popup. NOTE: This will not render the popupContent,
   * but it will monitor mouse activity over it
   */
  popupContent: ReactElement;
  /**
   * A callback function to execute when the mouse completely moves out from both the popupContent
   * and highlight (children).
   */
  onMouseOut: () => void;
  /**
   * Container children. Ideally, should be highlight components of some sort.
   */
  children: ReactElement;
}

/**
 * A container for a highlight component that monitors whether a mouse is over a highlight
 * and over some secondary/popup content. This does not render any popup/tip,
 * but it should ideally be used to set the visible state / rendering of a popup.
 */
const MonitoredHighlightContainer = ({
  onMouseOver,
  popupContent,
  onMouseOut,
  children,
}: MonitoredHighlightContainerProps) => {
  const mouseInRef = useRef(false); // Whether the mouse is over the child (highlight)

  // Create a mouse monitor for the popup content
  const monitorContent = (
    <MouseMonitor
      onMoveAway={() => {
        if (mouseInRef.current) {
          return;
        }

        onMouseOut();
      }}
      paddingX={60}
      paddingY={30}
    >
      {popupContent}
    </MouseMonitor>
  );

  return (
    <div
      onMouseOver={() => {
        mouseInRef.current = true;
        onMouseOver(monitorContent);
      }}
      onMouseOut={() => {
        mouseInRef.current = false;
      }}
    >
      {children}
    </div>
  );
};

export default MonitoredHighlightContainer;
