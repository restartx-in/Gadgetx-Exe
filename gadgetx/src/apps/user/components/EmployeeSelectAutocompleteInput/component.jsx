// src/apps/user/components/EmployeeSelectAutocompleteInput.jsx

import React, { useState, useEffect, forwardRef, useRef, useMemo } from 'react';
import { HiPencil } from 'react-icons/hi2';

// Simple InputField placeholder (assumed to be available globally or imported)
const InputField = ({ label, ...props }) => (
  <div className="input_wrapper">
    {label && <label className="input_label">{label}</label>}
    <input className="input_field" {...props} />
  </div>
);

const EmployeeSelectAutocompleteInput = forwardRef(
  (
    {
      name,
      value,
      onChange,
      options,
      label,
      placeholder = 'Select or add an employee',
      required = false,
      disabled = false,
      className = '',
      onAddNew,
      onEdit,
      is_edit,
      ...rest
    },
    ref
  ) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    const dropdownRef = useRef(null);
    const hasBeenFocused = useRef(false);

    useEffect(() => {
      // Set the input display value based on the numeric ID value prop
      const selectedOption = options.find((opt) => opt.value === value);
      setInputValue(selectedOption ? selectedOption.label : '');
    }, [value, options]);

    useEffect(() => {
      // Scroll to active index for keyboard navigation
      if (activeIndex >= 0 && dropdownRef.current) {
        const activeItem = dropdownRef.current.children[activeIndex];
        if (activeItem) {
          activeItem.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
          });
        }
      }
    }, [activeIndex]);

    const filteredOptions = useMemo(() => {
      // Filter options based on input value
      if (!inputValue) {
        return options;
      }
      return options.filter((opt) =>
        opt.label.toLowerCase().includes(inputValue.toLowerCase())
      );
    }, [inputValue, options]);

    const exactMatchExists = useMemo(
      // Check for exact match to hide "Add New" option when an exact match is typed
      () =>
        options.some(
          (opt) => opt.label.toLowerCase() === inputValue.toLowerCase().trim()
        ),
      [inputValue, options]
    );

    const showAddNewOption = inputValue && !exactMatchExists && onAddNew;

    const handleInputChange = (e) => {
      const currentInput = e.target.value;
      setInputValue(currentInput);
      setActiveIndex(-1);
      setShowDropdown(true);

      // Clear the underlying value if input is cleared
      if (currentInput.length === 0) {
        onChange({ target: { name, value: '' } });
      }
    };

    const handleSelectOption = (option) => {
      onChange({ target: { name, value: option.value } });
      setInputValue(option.label);
      setShowDropdown(false);
    };

    const handleAddNew = () => {
      if (onAddNew) {
        onAddNew(inputValue); // Pass the typed value to the wrapper
      }
      setShowDropdown(false);
    };

    const handleEditClick = (e, option) => {
      e.stopPropagation(); // Prevent dropdown from closing immediately
      if (onEdit) {
        onEdit(option);
        setShowDropdown(false);
      }
    };

    const handleFocus = () => {
      if (hasBeenFocused.current) {
        setShowDropdown(true);
      }
      hasBeenFocused.current = true;
    };

    const handleKeyDown = (e) => {
      if (disabled || !showDropdown) return;

      const itemsCount = filteredOptions.length + (showAddNewOption ? 1 : 0);
      if (itemsCount === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prevIndex) => (prevIndex + 1) % itemsCount);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(
            (prevIndex) => (prevIndex - 1 + itemsCount) % itemsCount
          );
          break;
        case 'Enter':
          if (activeIndex < 0) return;
          e.preventDefault();
          if (activeIndex < filteredOptions.length) {
            handleSelectOption(filteredOptions[activeIndex]);
          } else if (showAddNewOption) {
            handleAddNew();
          }
          break;
        case 'Escape':
          setShowDropdown(false);
          break;
        default:
          break;
      }
    };

    return (
      <div className={`input_wrapper autocomplete ${className}`}>
        {label && (
          <label htmlFor={name} className="input_label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={name}
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onClick={() => {
            setShowDropdown(true);
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          className="input_field"
          {...rest}
          // Use setTimeout to ensure the click event on the dropdown has time to register
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
        />
        {showDropdown && (
          <ul className="autocomplete__dropdown" ref={dropdownRef}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => (
                <li
                  key={opt.value}
                  // onMouseDown is used to select before onBlur closes the dropdown
                  onMouseDown={() => handleSelectOption(opt)} 
                  className={`autocomplete__option ${
                    index === activeIndex ? 'active' : ''
                  }`}
                >
                  <div className="customer_select_autocomplete_input-option_content">
                    <span>{opt.label}</span>
                    {/* The Customer component had a pencil icon for edit. Adding it here for consistency. */}
                    {is_edit && !disabled && (
                      <button
                        type="button"
                        className="customer_select_autocomplete_input-option_content-edit_button"
                        onMouseDown={(e) => handleEditClick(e, opt)}
                      >
                        <HiPencil />
                      </button>
                    )}
                  </div>
                </li>
              ))
            ) : showAddNewOption ? (
              <li
                onMouseDown={handleAddNew}
                className={`autocomplete__option autocomplete__option--add ${
                  activeIndex === 0 ? 'active' : ''
                }`}
              >
                + Add "{inputValue}"
              </li>
            ) : null}
          </ul>
        )}
        {/* The actual value is stored via onChange, this is mostly for structure consistency */}
      </div>
    );
  }
);

EmployeeSelectAutocompleteInput.displayName = 'EmployeeSelectAutocompleteInput';
export default EmployeeSelectAutocompleteInput;