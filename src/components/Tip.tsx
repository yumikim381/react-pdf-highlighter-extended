import React, { CSSProperties, ReactNode, useState } from "react";

import "../style/Tip.css";

interface Props {
  onOpen: () => void;
  compactStyle?: CSSProperties;
  children: ReactNode;
}

const Tip = ({ onOpen, compactStyle, children }: Props) => {
  const [compact, setCompact] = useState(true);
  return (
    <div className="Tip">
      {compact ? (
        <div
          className="Tip__compact"
          onClick={() => {
            onOpen();
            setCompact(false);
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
