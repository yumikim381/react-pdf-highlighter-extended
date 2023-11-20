import React, { useRef } from "react";
import MouseMonitor from "./MouseMonitor";

interface Props {
  /**
   * A callback function to execute when the mouse hovers over the children.
   * @param {React.JSX.Element} popupContent - The content to display in the popup.
   */
  onMouseOver: (monitoredPopupContent: React.JSX.Element) => void;

  /**
   * The content to display in the popup.
   */
  popupContent: React.JSX.Element;

  /**
   * A callback function to execute when the mouse moves out of the component.
   */
  onMouseOut: () => void;

  /**
   * The child elements.
   */
  children: React.JSX.Element;
}

/**
 * A component that displays a popup when the mouse hovers over its children.
 *
 * @param {Props} props - The component's properties.
 */
const MonitoredHighlightContainer = ({
  onMouseOver,
  popupContent,
  onMouseOut,
  children,
}: Props) => {
  const mouseIn = useRef(false); // Whether the mouse is over the child

  // Create a mouse monitor for the popup content
  const monitorContent = (
    <MouseMonitor
      onMoveAway={() => {
        if (mouseIn.current) {
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
        mouseIn.current = true;
        onMouseOver(monitorContent);
      }}
      onMouseOut={() => {
        mouseIn.current = false;
      }}
    >
      {children}
    </div>
  );
};

export default MonitoredHighlightContainer;
