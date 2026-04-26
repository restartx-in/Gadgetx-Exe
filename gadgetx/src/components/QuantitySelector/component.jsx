import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './style.scss';

const QuantitySelector = ({ initialValue = 0, min = 0, max = 100000, onChange, disabled = false }) => {
  const [quantity, setQuantity] = useState(initialValue);

  useEffect(() => {
    setQuantity(initialValue);
  }, [initialValue]);

  const handleDecrement = () => {
    if (disabled) return;

    const newQuantity = quantity - 1;
    if (newQuantity >= min) {
      setQuantity(newQuantity);
      onChange?.(newQuantity);
    }
  };

  const handleIncrement = () => {
    if (disabled) return;

    const newQuantity = quantity + 1;
    if (newQuantity <= max) {
      setQuantity(newQuantity);
      onChange?.(newQuantity);
    }
  };

  return (
    <div className="quantity_selector">
      <button
        type="button"
        className="quantity_selector__btn"
        onClick={handleDecrement}
        disabled={disabled || quantity <= min}
      >
        -
      </button>

      <div className="quantity_selector__display">
        {quantity}
      </div>

      <button
        type="button"
        className="quantity_selector__btn"
        onClick={handleIncrement}
        disabled={disabled || quantity >= max}
      >
        +
      </button>
    </div>
  );
};

QuantitySelector.propTypes = {
  initialValue: PropTypes.number,
  min: PropTypes.number,
  max: PropTypes.number,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};

export default QuantitySelector;
