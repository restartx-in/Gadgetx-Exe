import React, { useState, useRef, useEffect } from 'react'
import InputAdornment from '@mui/material/InputAdornment'

// 1. Import Custom Components
import CustomTextField from '@/components/CustomTextField'
import CustomScrollbar from '@/components/CustomScrollbar'

import './style.scss'

const SelectField = ({
  name,
  value,
  onChange,
  options = [],
  label,
  placeholder = 'Select...',
  disabled = false,
  className = '',
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [wrapperRef])

  // Helper to determine what text to display
  const getDisplayValue = () => {
    if (!value) return ''

    const selectedOption = options.find((opt) =>
      typeof opt === 'string' ? opt === value : opt.value === value,
    )

    if (selectedOption) {
      return typeof selectedOption === 'string'
        ? selectedOption
        : selectedOption.label
    }
    return ''
  }

  const displayValue = getDisplayValue()

  const handleOptionClick = (optionValue) => {
    const simulatedEvent = {
      target: {
        name: name,
        value: optionValue,
      },
    }
    onChange(simulatedEvent)
    setIsOpen(false)
  }

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  return (
    <div
      className={`custom-select ${disabled ? 'disabled' : ''} ${className}`}
      ref={wrapperRef}
    >
      <CustomTextField
        name={name}
        label={label}
        value={displayValue}
        onClick={toggleDropdown}
        placeholder={placeholder}
        disabled={disabled}
        fullWidth
        variant="outlined"
        autoComplete="off"
        className="custom-select__input"
        InputProps={{
          readOnly: true, // Acts like a select trigger
          endAdornment: (
            <InputAdornment position="end" style={{ marginRight: '-8px' }}>
              <i className={`custom-select__chevron ${isOpen ? 'open' : ''}`} />
            </InputAdornment>
          ),
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
          className="custom-select__list" 
          role="listbox"
          as="ul"
        >
          {options.map((opt) => {
            const optionValue = typeof opt === 'string' ? opt : opt.value
            const optionLabel = typeof opt === 'string' ? opt : opt.label

            return (
              <li
                key={optionValue}
                className={`custom-select__option ${
                  value === optionValue ? 'selected' : ''
                }`}
                onClick={() => handleOptionClick(optionValue)}
                role="option"
                aria-selected={value === optionValue}
              >
                {optionLabel}
              </li>
            )
          })}
        </CustomScrollbar>
      )}
    </div>
  )
}

export default SelectField