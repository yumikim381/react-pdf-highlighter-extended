import React, { useEffect, useState } from "react";
import { useSelectionTipContext } from "../../src/contexts/SelectionTipContext";
import { Comment, GhostHighlight } from "./react-pdf-highlighter";
import "./style/ExpandableTip.css";

interface ExpandableTipProps {
  addHighlight: (highlight: GhostHighlight, comment: Comment) => void;
}

const ExpandableTip = ({ addHighlight }: ExpandableTipProps) => {
  const [compact, setCompact] = useState(true);
  const {
    selectionPosition,
    selectionContent,
    hideTipAndGhostHighlight,
    makeGhostHighlight,
    updatePosition,
  } = useSelectionTipContext();

  useEffect(() => {
    updatePosition();
  }, [compact]);

  return (
    <div className="Tip">
      {compact ? (
        <div
          className="Tip__compact"
          onClick={() => {
            setCompact(false);
            makeGhostHighlight();
          }}
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

export default ExpandableTip;
