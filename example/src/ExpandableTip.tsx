import React, { useLayoutEffect, useState } from "react";
import CommentForm from "./CommentForm";
import {
  Comment,
  GhostHighlight,
  useSelectionContext,
  useTipContext,
} from "./react-pdf-highlighter-extended";
import "./style/ExpandableTip.css";

interface ExpandableTipProps {
  addHighlight: (highlight: GhostHighlight, comment: Comment) => void;
}

const ExpandableTip = ({ addHighlight }: ExpandableTipProps) => {
  const [compact, setCompact] = useState(true);

  const { position, content, removeGhostHighlight, makeGhostHighlight } =
    useSelectionContext();

  const { setTip, updatePosition } = useTipContext();

  useLayoutEffect(() => {
    updatePosition!();
  }, [compact]);

  return (
    <div className="Tip">
      {compact ? (
        <button
          className="Tip__compact"
          onClick={() => {
            setCompact(false);
            makeGhostHighlight();
          }}
        >
          Add highlight
        </button>
      ) : (
        <CommentForm
          placeHolder="Your comment..."
          onSubmit={(input) => {
            const comment = { text: input };
            addHighlight({ content, position }, comment);

            removeGhostHighlight();
            setTip(null);
          }}
        />
      )}
    </div>
  );
};

export default ExpandableTip;
