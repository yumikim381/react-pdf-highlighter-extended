import React, { useEffect, useRef } from "react";

interface Props {
  onMoveAway: () => void;
  paddingX: number;
  paddingY: number;
  children: JSX.Element;
}

const MouseMonitor = ({ onMoveAway, paddingX, paddingY, children }: Props) => {
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
    document.addEventListener("mousemove", onMouseMove);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  });

  return <div ref={container}>{children}</div>;
};

export default MouseMonitor;
