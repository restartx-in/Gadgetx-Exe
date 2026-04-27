import React, { useState, useRef, useEffect, forwardRef } from "react"; // Added forwardRef
import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";
import "./style.scss";

const Select = forwardRef(({
  name,
  value,
  onChange,
  options = [],
  label,
  placeholder = "Select...",
  disabled = false,
  required = false,
  className = "",
  ...rest
}, ref) => { 
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);

  // Sync display value when the prop value changes
  useEffect(() => {
    const selectedOption = options.find((opt) =>
      typeof opt === "string" ? opt === value : opt.value === value
    );

    if (selectedOption) {
      setDisplayValue(
        typeof selectedOption === "string"
          ? selectedOption
          : selectedOption.label
      );
    } else {
      setDisplayValue("");
    }
}, [value, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  };

  const handleSelect = (option) => {
    const optionValue = typeof option === "string" ? option : option.value;

    const simulatedEvent = {
      target: {
        name: name,
        value: optionValue,
      },
    };

    if (onChange) {
      onChange(simulatedEvent);
    }
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const itemsCount = options.length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prevIndex) => (prevIndex + 1) % itemsCount);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex(
          (prevIndex) => (prevIndex - 1 + itemsCount) % itemsCount
        );
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < options.length) {
          handleSelect(options[activeIndex]);
        }
        break;
      case "Escape":
      case "Tab":
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`custom-select-box ${className}`}
    >
      <CustomTextField
        id={name}
        name={name}
        label={label}
        value={displayValue}
        inputRef={ref} 
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        // Ensure input is read-only so mobile keyboards don't pop up
        inputProps={{
          readOnly: true,
          style: { cursor: disabled ? "default" : "pointer" },
        }}
        InputProps={{
          endAdornment: (
            <div className={`custom-select-box__chevron ${isOpen ? "open" : ""}`}>
              <i className="chevron-icon" />
            </div>
          ),
        }}
        {...rest}
      />

      {isOpen && (
        <CustomScrollbar
          className="custom-select-box__dropdown"
          activeIndex={activeIndex}
          as="ul"
        >
          {options.length > 0 ? (
            options.map((opt, index) => {
              const optionValue = typeof opt === "string" ? opt : opt.value;
              const optionLabel = typeof opt === "string" ? opt : opt.label;
              const isSelected = value === optionValue;
              const isActive = index === activeIndex;

              return (
                <li
                  key={optionValue}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent text field blur
                    handleSelect(opt);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`custom-select-box__option ${
                    isActive ? "active" : ""
                  } ${isSelected ? "selected" : ""}`}
                >
                  <div className="custom-select-box__option-content">
                    <span style={{ fontWeight: isSelected ? 600 : 400 }}>
                      {optionLabel}
                    </span>
                  </div>
                </li>
              );
            })
          ) : (
            <li
              className="custom-select-box__option no-data"
            >
              No options available
            </li>
          )}
        </CustomScrollbar>
      )}
    </div>
);
});

export default Select;