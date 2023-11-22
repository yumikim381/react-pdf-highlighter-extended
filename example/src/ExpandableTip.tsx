import React, { CSSProperties, ReactNode, useEffect, useState } from "react";
import { useTipContext } from "../../src/contexts/TipContext";
import { Comment, GhostHighlight } from "./react-pdf-highlighter";

interface Props {
  addHighlight: (highlight: GhostHighlight, comment: Comment) => void;
}

const SelectionTip = ({ addHighlight }: Props) => {
  const [compact, setCompact] = useState(true);
  const {
    selectionPosition,
    selectionContent,
    hideTipAndGhostHighlight,
    makeGhostHighlight,
    updatePosition,
  } = useTipContext();

  useEffect(() => {
    updatePosition();
  }, [compact]);

  const compactStyle: CSSProperties = {
    cursor: "pointer",
    backgroundColor: "#3d464d",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    color: "white",
    padding: "5px 10px",
    borderRadius: "3px",
  };

  return (
    <div className="Tip">
      {compact ? (
        <div
          className="Tip__compact"
          onClick={() => {
            setCompact(false);
            makeGhostHighlight();
          }}
          style={compactStyle}
        >
          Add highlight
        </div>
      ) : (
        <button
          onClick={() => {
            const comment = { text: "comment" };
            addHighlight(
              { content: selectionContent, position: selectionPosition },
              comment
            );

            hideTipAndGhostHighlight();
          }}
          style={{ padding: "20px" }}
        >
          This is a button!
        </button>
      )}
    </div>
  );
};

export default SelectionTip;
