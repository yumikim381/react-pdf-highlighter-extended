import React, { useEffect, useState } from "react";
import { useSelectionTipContext } from "../../src/contexts/SelectionTipContext";
import { Comment, GhostHighlight } from "./react-pdf-highlighter";
import "./style/ExpandableTip.css";

interface ExpandableTipProps {
  addHighlight: (highlight: GhostHighlight, comment: Comment) => void;
}

const ExpandableTip = ({ addHighlight }: ExpandableTipProps) => {
  const [compact, setCompact] = useState(true);
  const [input, setInput] = useState<string | null>(null);

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
        <form
          className="Tip__card"
          onSubmit={(event) => {
            event.preventDefault();
            const comment = { text: input ?? "" };
            addHighlight(
              { content: selectionContent, position: selectionPosition },
              comment
            );

            hideTipAndGhostHighlight();
          }}
        >
          <div>
            <textarea
              placeholder="Your comment..."
              autoFocus
              onChange={(event) => {
                console.log(event.target.value);
                setInput(event.target.value);
              }}
            />
          </div>
          <div>
            <input type="submit" value="Save" />
          </div>
        </form>
      )}
    </div>
  );
};

export default ExpandableTip;
