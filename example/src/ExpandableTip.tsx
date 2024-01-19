import React, { useLayoutEffect, useRef, useState } from "react";
import CommentForm from "./CommentForm";
import {
  Comment,
  GhostHighlight,
  PdfSelection,
  usePdfHighlighterContext,
  useTipContext,
} from "./react-pdf-highlighter-extended";
import "./style/ExpandableTip.css";

interface ExpandableTipProps {
  addHighlight: (highlight: GhostHighlight, comment: Comment) => void;
}

const ExpandableTip = ({ addHighlight }: ExpandableTipProps) => {
  const [compact, setCompact] = useState(true);
  const selectionRef = useRef<PdfSelection | undefined>(undefined);

  const { getCurrentSelection, removeGhostHighlight } =
    usePdfHighlighterContext();

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
            selectionRef.current = getCurrentSelection();
            selectionRef.current!.makeGhostHighlight();
          }}
        >
          Add highlight
        </button>
      ) : (
        <CommentForm
          placeHolder="Your comment..."
          onSubmit={(input) => {
            const comment = { text: input };
            addHighlight(
              {
                content: selectionRef.current!.content,
                position: selectionRef.current!.position,
              },
              comment,
            );

            removeGhostHighlight();
            setTip(null);
          }}
        />
      )}
    </div>
  );
};

export default ExpandableTip;
