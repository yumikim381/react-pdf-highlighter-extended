import React, { useCallback, useEffect, useState } from "react";
import {
  Comment,
  GhostHighlight,
  useTipContainerUtils,
  useTipViewerUtils,
  useSelectionUtils,
} from "./react-pdf-highlighter";
import "./style/ExpandableTip.css";
import CommentForm from "./CommentForm";

interface ExpandableTipProps {
  addHighlight: (highlight: GhostHighlight, comment: Comment) => void;
}

const ExpandableTip = ({ addHighlight }: ExpandableTipProps) => {
  const [compact, setCompact] = useState(true);

  const {
    selectionPosition,
    selectionContent,
    removeGhostHighlight,
    makeGhostHighlight,
  } = useSelectionUtils();

  const { setTip } = useTipViewerUtils();
  const { updatePosition } = useTipContainerUtils();

  // callback ref allows us to update the position of the tip
  // before it renders, preventing any flickering.
  const updatePositionRef = useCallback(updatePosition, []);

  return (
    <div className="Tip">
      {compact ? (
        <div
          className="Tip__compact"
          onClick={() => {
            setCompact(false);
            makeGhostHighlight();
          }}
          ref={updatePositionRef}
        >
          Add highlight
        </div>
      ) : (
        <CommentForm
          placeHolder="Your comment..."
          callbackRef={updatePositionRef}
          onSubmit={(input) => {
            const comment = { text: input };
            addHighlight(
              { content: selectionContent, position: selectionPosition },
              comment
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
