import React, { useState, useEffect, useRef } from 'react';
import './style.scss';

const AutocompleteInput = ({
  name,
  value,
  onChange,
  options,
  label,
  placeholder = '',
  required = false,
  disabled = false,
  className = '',
  ...rest
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef(null);


  const handleInputChange = (e) => {
    onChange(e);
    const val = e.target.value.toLowerCase();
    setActiveIndex(-1); // Reset highlight when typing

    // If the input is empty, show all options again
    if (val.length === 0) {
      setFiltered(options);
      setShowDropdown(true);
    } else {
      const matches = options.filter((opt) =>
        (typeof opt === 'string' ? opt : opt.label).toLowerCase().includes(val)
      );
      setFiltered(matches);
      setShowDropdown(matches.length > 0);
    }
  };

  const handleSelect = (option) => {
    const val = typeof option === 'string' ? option : option.value;
    onChange({ target: { name, value: val } });
    setShowDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prevIndex) =>
          prevIndex < filtered.length - 1 ? prevIndex + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : filtered.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0) {
          handleSelect(filtered[activeIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
      default:
        break;
    }
  };
  
  // Scroll the highlighted item into view
  useEffect(() => {
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

  // NEW: Handle click to show all options if input is empty
  const handleInputClick = () => {
    if (value.length === 0) {
      setFiltered(options);
      setShowDropdown(true);
    }
  };


  return (
    <div className={`autocomplete ${className}`}>
      {label && (
        <label htmlFor={name} className="autocomplete__label">
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onClick={handleInputClick} // Use onClick instead of onFocus
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
        className="autocomplete__input"
        {...rest}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />
      {showDropdown && (
        <ul className="autocomplete__dropdown" ref={dropdownRef}>
          {filtered.map((opt, index) => (
            <li
              key={typeof opt === 'string' ? opt : opt.value}
              onMouseDown={() => handleSelect(opt)}
              className={`autocomplete__option ${
                index === activeIndex ? 'active' : ''
              }`}
            >
              {typeof opt === 'string' ? opt : opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInput;