import React, { useState } from "react";

interface TipCardProps<T> {
  form: React.ReactElement;
  onConfirm: (data: T) => void;
}

const TipCard = <T,>({ form, onConfirm }: TipCardProps<T>) => {
  const [formData, setFormData] = useState<T | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (formData) {
      onConfirm(formData);
    }
  };

  const handleChange = (data: T) => {
    setFormData(data);
  };

  return (
    <form className="Tip__card" onSubmit={handleSubmit}>
      {React.cloneElement(form, { onChange: handleChange })}
      <div>
        <input type="submit" value="Save" />
      </div>
    </form>
  );
};

export default TipCard;
