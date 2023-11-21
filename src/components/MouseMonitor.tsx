import React, { ReactElement, useEffect, useRef } from "react";

interface MouseMonitorProps {
  /**
   * A callback function to be executed when the mouse moves away from the monitored area.
   */
  onMoveAway: () => void;

  /**
   * The horizontal padding around the monitored area.
   */
  paddingX: number;

  /**
   * The vertical padding around the monitored area.
   */
  paddingY: number;

  /**
   * The content to be wrapped by the MouseMonitor.
   */
  children: ReactElement;
}

/**
 * A component that monitors mouse movements over a child and invisible padded area.
 *
 * @param {MouseMonitorProps} props - The component's props.
 */
const MouseMonitor = ({
  onMoveAway,
  paddingX,
  paddingY,
  children,
}: MouseMonitorProps) => {
  const container = useRef<HTMLDivElement | null>(null);

  const onMouseMove = (event: MouseEvent) => {
    if (!container.current) return;

    const { clientX, clientY } = event;
    const { left, top, width, height } =
      container.current.getBoundingClientRect();

    const inBoundsX =
      clientX > left - paddingX && clientX < left + width + paddingX;
    const inBoundsY =
      clientY > top - paddingY && clientY < top + height + paddingY;

    if (!(inBoundsX && inBoundsY)) {
      onMoveAway();
    }
  };

  useEffect(() => {
    // TODO: Throttle this
    document.addEventListener("mousemove", onMouseMove);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  });

  return <div ref={container}>{children}</div>;
};

export default MouseMonitor;
