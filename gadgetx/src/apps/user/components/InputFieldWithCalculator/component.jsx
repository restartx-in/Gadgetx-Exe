import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { IoCalculator } from 'react-icons/io5';
import { BsArrowReturnLeft } from 'react-icons/bs';
import InputAdornment from '@mui/material/InputAdornment';

// 1. Import Custom Components
import CustomTextField from '@/components/CustomTextField';
import CustomScrollbar from '@/components/CustomScrollbar';

import './style.scss';

const InputFieldWithCalculator = forwardRef(({
  value: valueProp,
  onChange,
  name,
  onBlur,
  error,
  inputRef,
  label,
  disabled = false,
  maxLength = 11,
  decimalLength = 2,
  ...rest
}, ref) => {
  const [calc, setCalc] = useState('');
  const [showPopover, setShowPopover] = useState(false);

  const wrapperRef = useRef(null);
  const popoverInputRef = useRef(null);

  useEffect(() => {
    if (disabled) {
      setShowPopover(false);
    }
  }, [disabled]);

  const handleCalculate = () => {
    if (calc.trim() === '') return;
    try {
       
      const result = eval(calc);
      if (typeof result === 'number' && !isNaN(result)) {
        const formattedResult = Number(result.toFixed(decimalLength)).toString();
        onChange?.({ target: { name, value: formattedResult } });
        setCalc('');
        setShowPopover(false);
      }
    } catch (error) {
      console.error('Invalid calculation:', error);
    }
  };

  const handleMainChange = (event) => {
    let val = event.target.value;

    // Allow only digits and at most one decimal point
    if (!/^\d*\.?\d*$/.test(val)) {
      return; 
    }

    if (val === '') {
      onChange?.({ target: { name, value: '' } });
      return;
    }

    // Prevent leading zeros unless decimal
    if (!val.startsWith('0.') && val.length > 1 && val.startsWith('0')) {
      val = val.slice(1);
    }

    // Enforce decimal length
    val = val
      .toString()
      .split('.')
      .slice(0, 2)
      .map((el, i) => (i ? el.slice(0, decimalLength) : el))
      .join('.');

    onChange?.({ target: { name, value: val } });
  };

  const handleCalcKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCalculate();
    }
  };

  const handleIconClick = () => {
    if (disabled) return;
    setShowPopover((prev) => !prev);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowPopover(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (showPopover) {
      popoverInputRef.current?.focus();
    }
  }, [showPopover]);

  return (
    <div
      className={`custom-calculator-input ${disabled ? 'disabled' : ''}`}
      ref={wrapperRef}
       style={{ position: "relative", width: "100%" }} 
    >
      <CustomTextField
        {...rest}
        inputRef={inputRef || ref}
        label={label}
        name={name}
        id={name}
        value={valueProp ?? ''}
        onChange={handleMainChange}
        onBlur={onBlur}
        error={!!error}
        helperText={error?.message}
        disabled={disabled}
        fullWidth
        variant="outlined"
        autoComplete="off"
        className="custom-calculator-input__field"
        // Added InputProps to render the calculator icon using InputAdornment
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <span 
                onClick={handleIconClick} 
                style={{ 
                  cursor: disabled ? 'default' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center' 
                }}
              >
                <IoCalculator size={18} />
              </span>
            </InputAdornment>
          ),
        }}
        inputProps={{
          inputMode: "decimal",
          pattern: "[0-9]*",
          maxLength: maxLength,
        }}
        slotProps={{
            htmlInput: {
              autoComplete: 'off',
              ...rest
            },
            inputLabel: {
              required: false // Hides asterisk
            }
          }}
      />

      {showPopover && (
        <div className="custom-calculator-input__popover">
          <input
            ref={popoverInputRef}
            type="text"
            value={calc}
            placeholder="e.g. 10+5*2"
            onChange={(e) => {
              const newVal = e.target.value;
              if (/^[0-9+\-*/().\s]*$/.test(newVal)) {
                setCalc(newVal);
              }
            }}
            onKeyDown={handleCalcKeyDown}
            className="custom-calculator-input__popover-input"
          />
          <button
            type="button"
            className="custom-calculator-input__calculate-btn"
            onClick={handleCalculate}
            aria-label="Calculate"
          >
            <BsArrowReturnLeft />
          </button>
        </div>
      )}
    </div>
  );
});

export default InputFieldWithCalculator;