import React, { useState } from "react";
import MouseMonitor from "./MouseMonitor";

interface Props {
  /**
   * A callback function to execute when the mouse hovers over the children.
   * @param {JSX.Element} content - The content to display in the popup.
   */
  onMouseOver: (content: JSX.Element) => void;

  /**
   * The content to display in the popup.
   */
  popupContent: JSX.Element;

  /**
   * A callback function to execute when the mouse moves out of the component.
   */
  onMouseOut: () => void;

  /**
   * The child elements.
   */
  children: JSX.Element;
}

/**
 * A component that displays a popup when the mouse hovers over its children.
 *
 * @param {Props} props - The component's properties.
 */
const Popup = ({ onMouseOver, popupContent, onMouseOut, children }: Props) => {
  const [mouseIn, setMouseIn] = useState(false); // Whether the mouse is over the child

  // Create a mouse monitor for the popup content
  const monitorContent = (
    <MouseMonitor
      onMoveAway={() => {
        if (mouseIn) {
          // If the mouse is still on the parent's child
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
        setMouseIn(true);
        onMouseOver(monitorContent);
      }}
      onMouseOut={() => {
        setMouseIn(false);
      }}
    >
      {children}
    </div>
  );
};

export default Popup;
