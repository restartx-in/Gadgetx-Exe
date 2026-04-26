import React from "react";
import "./style.scss";

const PayrollButton = ({ icon, children, className, ...rest }) => {
  return (
    <button className={`action-button-component ${className || ""}`} {...rest}>
      {icon}
      <span>{children}</span>
    </button>
  );
};

export default PayrollButton;
