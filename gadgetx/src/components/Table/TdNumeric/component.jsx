import React from "react";
import "./style.scss";
import AmountSymbol from "@/components/AmountSymbol";

const TdNumeric = ({ children }) => {
  return (
    <td>
      <div className="td_numeric fs16">
        <AmountSymbol>{children}</AmountSymbol>
      </div>
    </td>
  );
};

export default TdNumeric;
