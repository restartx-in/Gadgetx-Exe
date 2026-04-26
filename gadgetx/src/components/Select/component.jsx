import React, { useState, useEffect, useRef, forwardRef } from 'react';
import InputAdornment from '@mui/material/InputAdornment';

// 1. Import Custom Components
import CustomTextField from '@/components/CustomTextField';
import CustomScrollbar from '@/components/CustomScrollbar';

import './style.scss';

const Select = forwardRef((
  {
    name,
    value,
    onChange,
    options,
    required = false,
    disabled = false,
    className = '',
    placeholder = '',
    label,
    ...rest
  },
  ref,
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  
  // Note: listRef and the scrolling useEffect are removed 
  // because CustomScrollbar handles the scrolling via activeIndex.

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Highlight selected or first option on open
  useEffect(() => {
    if (isOpen) {
      const currentIndex = options.findIndex((opt) => opt.value === value);
      setActiveIndex(currentIndex !== -1 ? currentIndex : 0);
    }
  }, [isOpen, options, value]);

  const handleOptionClick = (optionValue) => {
    setIsOpen(false);
    if (onChange) {
      const syntheticEvent = {
        target: { name, value: optionValue },
      };
      onChange(syntheticEvent);
    }
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setActiveIndex((prevIndex) =>
            prevIndex < options.length - 1 ? prevIndex + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setActiveIndex((prevIndex) =>
            prevIndex > 0 ? prevIndex - 1 : options.length - 1
          );
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen) {
          if (activeIndex >= 0) {
            handleOptionClick(options[activeIndex].value);
          }
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const getSelectedLabel = () => {
    const selectedOption = options.find((opt) => opt.value === value);
    return selectedOption ? selectedOption.label : '';
  };

  return (
    <div
      className={`custom_select_wrapperr ${className} ${disabled ? 'disabled' : ''}`}
      ref={wrapperRef}
    >
      <CustomTextField
        ref={ref}
        label={label}
        value={getSelectedLabel()}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        fullWidth
        variant="outlined"
        autoComplete="off"
        className="custom_select_headerr"
        InputProps={{
          readOnly: true, // Prevents typing, acts like a button
          endAdornment: (
            <InputAdornment position="end">
              <span className={`custom_select_chevronn ${isOpen ? 'open' : ''}`}></span>
            </InputAdornment>
          ),
          style: { cursor: disabled ? 'not-allowed' : 'pointer' }
        }}
        inputProps={{
          style: { cursor: disabled ? 'not-allowed' : 'pointer' }
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
        {...rest}
      />

      {isOpen && (
        <CustomScrollbar 
          className="custom_select_listt" 
          activeIndex={activeIndex}
          as="ul"
        >
          {options.map((opt, index) => (
            <li
              key={opt.value}
              className={`custom_select_list_itemm ${
                value === opt.value ? 'selected' : ''
              } ${index === activeIndex ? 'active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent focus loss on input
                handleOptionClick(opt.value);
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {opt.label}
            </li>
          ))}
        </CustomScrollbar>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;