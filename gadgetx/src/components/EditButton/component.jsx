import React from 'react';
import { FaRegEdit } from "react-icons/fa";
import './style.scss'; // <-- Changed to style.scss

const EditButton = ({ onClick, type = 'button', className = '', children }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`edit_button fs10 fw500 ${className}`}
    >
      <FaRegEdit className="edit_button-icon" size={18} />
      <span className="edit_button-text">{children}</span>
    </button>
  );
};

export default EditButton;
