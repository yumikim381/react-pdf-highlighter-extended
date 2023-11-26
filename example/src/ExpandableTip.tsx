import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
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

  useLayoutEffect(() => {
    updatePosition();
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
