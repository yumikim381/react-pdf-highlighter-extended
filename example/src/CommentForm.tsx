import React, { useState } from "react";

interface CommentFormProps {
  onSubmit: (input: string) => void;
  callbackRef?: (node: HTMLFormElement) => void;
  placeHolder?: string;
}

const CommentForm = ({
  onSubmit,
  callbackRef,
  placeHolder,
}: CommentFormProps) => {
  const [input, setInput] = useState<string>("");

  return (
    <form
      className="Tip__card"
      ref={callbackRef}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(input);
      }}
    >
      <div>
        <textarea
          placeholder={placeHolder}
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
  );
};

export default CommentForm;
