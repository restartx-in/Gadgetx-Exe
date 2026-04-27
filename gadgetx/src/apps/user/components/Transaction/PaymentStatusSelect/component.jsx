import React, { useState, useEffect, useRef } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import './style.scss';

const defaultPaymentStatuses = [
  { value: '', label: 'Select Status' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partial' },
  { value: 'pending', label: 'Pending' },
];

const PaymentStatusSelect = ({
  label,
  name,
  value,
  onChange,
  required = false,
  options = defaultPaymentStatuses,
  disabled = false,
  className = ''
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    if (open) {
      const currentIndex = options.findIndex((opt) => opt.value === value);
      setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [open, options, value]);

  useEffect(() => {
    if (open && activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex];
      if (activeItem) {
        activeItem.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [activeIndex, open]);

  const handleSelect = (val) => {
    onChange({ target: { name, value: val } });
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          setOpen(true);
        } else {
          setActiveIndex((prevIndex) =>
            prevIndex < options.length - 1 ? prevIndex + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) {
          setOpen(true);
        } else {
          setActiveIndex((prevIndex) =>
            prevIndex > 0 ? prevIndex - 1 : options.length - 1
          );
        }
        break;
      case 'Enter':
      case ' ': 
        e.preventDefault();
        if (open) {
          if (activeIndex >= 0) {
            handleSelect(options[activeIndex].value);
          }
        } else {
          setOpen(true);
        }
        break;
      case 'Escape':
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || 'Select Status';

  return (
    <div
      ref={wrapperRef}
      className={`paymentstatus-select ${disabled ? 'disabled' : ''} ${className}`}
    >
      {label && (
        <label htmlFor={name} className="paymentstatus-select__label">
          {label}
        </label>
      )}
      
      {/* Replaced Div Header with MUI TextField */}
      <TextField
        value={selectedLabel}
        onClick={() => !disabled && setOpen(!open)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        required={required}
        fullWidth
        size="small"
        variant="outlined"
        autoComplete="off"
        className="paymentstatus-select__input"
        InputProps={{
          readOnly: true, // Acts like a select trigger
          endAdornment: (
            <InputAdornment position="end" style={{ marginRight: '-8px' }}>
              <span className={`paymentstatus-select__chevron ${open ? 'open' : ''}`} />
            </InputAdornment>
          ),
          style: { cursor: disabled ? 'not-allowed' : 'pointer' }
        }}
        inputProps={{
          style: { cursor: disabled ? 'not-allowed' : 'pointer' }
        }}
      />

      {open && (
        <ul className="paymentstatus-select__dropdown" ref={listRef}>
          {options.map((option, index) => (
            <li
              key={option.value}
              className={`paymentstatus-select__option ${
                index === activeIndex ? 'active' : '' 
              }`}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur
                handleSelect(option.value);
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PaymentStatusSelect; 