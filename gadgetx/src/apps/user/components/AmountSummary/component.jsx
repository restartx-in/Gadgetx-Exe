import React from "react";
import "./style.scss";
import AmountSymbol from "@/apps/user/components/AmountSymbol"; // adjust the path if needed

const AmountSummary = ({
  total = 0,
  received = 0,
  pending = 0,
  totalLabel = "Total Amount",
  receivedLabel = "Received Amount",
  pendingLabel = "Pending Amount",
}) => {
  return (
    <div className="amount-summary">
      {/* Total Amount */}
      <div className="amount-summary__card amount-summary__card--total">
        <p className="amount-summary__label fs12 fw600">{totalLabel}</p>
        <h3 className="amount-summary__value fs14 fw600">
          <AmountSymbol>{total}</AmountSymbol>
        </h3>
      </div>

      {/* Received Amount */}
      <div className="amount-summary__card amount-summary__card--received">
        <p className="amount-summary__label fs12 fw600">{receivedLabel}</p>
        <h3 className="amount-summary__value fs14 fw600">
          <AmountSymbol>{received}</AmountSymbol>
        </h3>
      </div>

      {/* Pending Amount */}
      <div className="amount-summary__card amount-summary__card--pending">
        <p className="amount-summary__label fs12 fw600">{pendingLabel}</p>
        <h3 className="amount-summary__value fs14 fw600">
          <AmountSymbol>{pending}</AmountSymbol>
        </h3>
      </div>
    </div>
  );
};

export default AmountSummary;
