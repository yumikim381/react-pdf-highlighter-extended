import React from "react";
import type { Comment } from "./react-pdf-highlighter-extended";

import "./style/HighlightPopup.css";

interface HighlightPopupProps {
  comment: Comment;
}

const HighlightPopup = ({ comment }: HighlightPopupProps) => {
  return comment.text ? (
    <div className="Highlight__popup">{comment.text}</div>
  ) : (
    <div className="Highlight__popup">Comment has no Text</div>
  );
};

export default HighlightPopup;
