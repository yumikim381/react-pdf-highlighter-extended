import React, { ReactElement, useEffect, useRef } from "react";

interface MouseMonitorProps {
  onMoveAway: () => void;
  paddingX: number;
  paddingY: number;
  children: ReactElement;
}

/**
 * A component that monitors mouse movements over a child and invisible padded area.
 */
const MouseMonitor = ({
  onMoveAway,
  paddingX,
  paddingY,
  children,
}: MouseMonitorProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onMouseMove = (event: MouseEvent) => {
    if (!containerRef.current) return;

    const { clientX, clientY } = event;
    const { left, top, width, height } =
      containerRef.current.getBoundingClientRect();

    const inBoundsX =
      clientX > left - paddingX && clientX < left + width + paddingX;
    const inBoundsY =
      clientY > top - paddingY && clientY < top + height + paddingY;

    if (!(inBoundsX && inBoundsY)) {
      onMoveAway();
    }
  };

  useEffect(() => {
    // TODO: Maybe optimise or throttle?
    document.addEventListener("mousemove", onMouseMove);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  });

  return <div ref={containerRef}>{children}</div>;
};

export default MouseMonitor;
