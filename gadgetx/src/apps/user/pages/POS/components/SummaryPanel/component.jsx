import React from 'react';
import InputField from '@/components/InputField';
import AmountSymbol from '@/components/AmountSymbol';

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
            className={discountType === 'Fixed' ? 'active' : ''}
            onClick={() => setDiscountType('Fixed')}
          >
            Fixed
          </button>
          <button
            className={discountType === 'Percentage' ? 'active' : ''}
            onClick={() => setDiscountType('Percentage')}
          >
            %
          </button>
        </div>
        <InputField
        label="Discount Amount"
          type="number"
          value={discount}
          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
          placeholder={discountType === 'Percentage' ? '%' : ''}
        />
       
      </div>
    </div>
    <div className="summary-totals">
      <p>
        Total QTY : <span>{calculations?.totalQty ?? 0}</span>
      </p>
      <p>
        Sub Total :{' '}
        <span>
          <AmountSymbol>{calculations?.subTotal ?? 0}</AmountSymbol>
        </span>
      </p>
      <p>
        Tax :{' '}
        <span>
          <AmountSymbol>{calculations?.taxAmount ?? 0}</AmountSymbol>
        </span>
      </p>
      <h3>
        Total :{' '}
        <span>
          <AmountSymbol>{calculations?.total ?? 0}</AmountSymbol>
        </span>
      </h3>
    </div>
    <div className="action-buttons">
      <button className="btn-hold" onClick={onHold}>
        Hold
      </button>
      <button className="btn-reset" onClick={onReset}>
        Reset
      </button>
      <button className="btn-pay" onClick={onPayNow} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  </div>
);

export default SummaryPanel;