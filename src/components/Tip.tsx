import React, { CSSProperties, ReactNode, useEffect, useState } from "react";

import "../style/Tip.css";

interface Props {
  onOpen: () => void;
  compactStyle?: CSSProperties;
  onUpdate?: () => void;
  children: ReactNode;
}

const Tip = ({ onOpen, compactStyle, onUpdate, children }: Props) => {
  const [compact, setCompact] = useState(true);

  useEffect(() => {
    if (onUpdate) onUpdate();
  }, [compact]);

  return (
    <div className="Tip">
      {compact ? (
        <div
          className="Tip__compact"
          onClick={() => {
            setCompact(false);
            onOpen();
          }}
          style={compactStyle}
        >
          Add highlight
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export default Tip;
