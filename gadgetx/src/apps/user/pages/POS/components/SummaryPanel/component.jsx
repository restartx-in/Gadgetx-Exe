import React from "react";
import InputField from "@/components/InputField";
import AmountSymbol from "@/apps/user/components/AmountSymbol";

const SummaryPanel = ({
  calculations,
  discountType,
  setDiscountType,
  discount,
  setDiscount,
  onReset,
  onPayNow,
  isProcessing,
  onHold,
}) => (
  <div className="summary-actions-area">
    <div className="summary-inputs">
      <div className="input-group">
        <label>Discount</label>
        <div className="discount-controls">
          <button
            className={discountType === "Fixed" ? "active" : ""}
            onClick={() => setDiscountType("Fixed")}
          >
            Fixed
          </button>
          <button
            className={discountType === "Percentage" ? "active" : ""}
            onClick={() => setDiscountType("Percentage")}
          >
            %
          </button>
        </div>
        <InputField
          label="Discount Amount"
          type="number"
          value={discount}
          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
          placeholder={discountType === "Percentage" ? "%" : ""}
        />
      </div>
    </div>
    <div className="summary-totals">
      <p>
        Total QTY : <span>{calculations?.totalQty ?? 0}</span>
      </p>
      <p>
        Sub Total :{" "}
        <span>
          <AmountSymbol>{calculations?.subTotal ?? 0}</AmountSymbol>
        </span>
      </p>
      <p style={{ opacity: 0.65, fontSize: "0.9em" }}>
        Tax (Incl.) :{" "}
        <span>
          <AmountSymbol>{calculations?.taxAmount ?? 0}</AmountSymbol>
        </span>
      </p>
      <h3>
        Total :{" "}
        <span>
          <AmountSymbol>{calculations?.total ?? 0}</AmountSymbol>
        </span>
      </h3>
    </div>
    <div className="action-buttons">
      <button className="btn-hold" onClick={onHold} title="F3">
        Hold <kbd>F3</kbd>
      </button>
      <button className="btn-reset" onClick={onReset} title="F8">
        Reset <kbd>F8</kbd>
      </button>
      <button className="btn-pay" onClick={onPayNow} disabled={isProcessing} title="F2">
        {isProcessing ? "Processing..." : <>Pay Now <kbd>F2</kbd></>}
      </button>
    </div>
  </div>
);

export default SummaryPanel;
