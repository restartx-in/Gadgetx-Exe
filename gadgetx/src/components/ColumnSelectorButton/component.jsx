import React from 'react';
import './style.scss';

const ColumnSelectorButton = ({ onClick, size = 18, ...rest }) => {
  return (
    <button className="column_selector_button" onClick={onClick} {...rest}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 4V20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
};

export default ColumnSelectorButton;