import React, { useEffect, useState } from "react";

import "../style/Tip.css";
import TipCard from "./TipCard";

interface Props {
  onConfirm: (data: any) => void;
  onOpen: () => void;
  onUpdate?: () => void;
}

const Tip = ({ onConfirm, onOpen, onUpdate }: Props) => {
  const [compact, setCompact] = useState(true);

  useEffect(() => {
    if (onUpdate) onUpdate();
  }, [compact]);

  const commentForm = <textarea placeholder="Your comment" autoFocus />;

  return (
    <div className="Tip">
      {compact ? (
        <div
          className="Tip__compact"
          onClick={() => {
            onOpen();
            setCompact(false);
          }}
        >
          Add highlight
        </div>
      ) : (
        <TipCard form={commentForm} onConfirm={onConfirm} />
      )}
    </div>
  );
};

export default Tip;
