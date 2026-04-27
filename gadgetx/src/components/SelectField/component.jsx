
import React, { useState, useRef, useEffect, forwardRef} from "react";
import { createPortal } from "react-dom";
import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";
import "./style.scss";

const SelectField = forwardRef(({

  name,
  value,
  onChange,
  options = [],
  label,
  placeholder = "Select...",
  disabled = false,
  required = false,
  className = "",
  menuPortalTarget,
  ...rest
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideWrapper = wrapperRef.current && !wrapperRef.current.contains(event.target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target);
      
      if (isOutsideWrapper && (!menuPortalTarget || isOutsideDropdown)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef, menuPortalTarget]);

  const updateDropdownPosition = () => {
    if (menuPortalTarget && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 1,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
        marginTop: 0,
      });
    }
  };

  useEffect(() => {
    if (isOpen && menuPortalTarget) {
      updateDropdownPosition();
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [isOpen, menuPortalTarget]);

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

    onChange(simulatedEvent);
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
      className={`select-field ${className}`}
      style={{ position: "relative" }}
    >
      <CustomTextField
        id={name}
        name={name}
        label={label}
        value={displayValue}
        placeholder={placeholder}
        inputRef={ref}
        required={required}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        inputProps={{
          readOnly: true,
          style: { cursor: disabled ? "default" : "pointer" },
        }}
        InputProps={{
          endAdornment: (
            <div className={`select-field__chevron ${isOpen ? "open" : ""}`}>
              <i className="chevron-icon" />
            </div>
          ),
        }}
        {...rest}
      />

      {isOpen && (() => {
        const dropdownContent = (
          <CustomScrollbar
            className="select-field__dropdown"
            activeIndex={activeIndex}
            as="ul"
            ref={dropdownRef}
            style={menuPortalTarget ? dropdownStyle : undefined}
          >
            {options.length > 0 ? (
              options.map((opt, index) => {
                const optionValue = typeof opt === "string" ? opt : opt.value;
                const optionLabel = typeof opt === "string" ? opt : opt.label;
                const isSelected = value === optionValue;

                return (
                  <li
                    key={optionValue}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(opt);
                    }}
                    className={`select-field__option ${
                      index === activeIndex ? "active" : ""
                    } ${isSelected ? "selected" : ""}`}
                  >
                    <div className="select-field__option-content">
                      <span style={{ fontWeight: isSelected ? 600 : 400 }}>
                        {optionLabel}
                      </span>
                    </div>
                  </li>
                );
              })
            ) : (
              <li
                className="select-field__option"
                style={{ cursor: "default", color: "#94a3b8" }}
              >
                No options available
              </li>
            )}
          </CustomScrollbar>
        );

        return menuPortalTarget
          ? createPortal(dropdownContent, menuPortalTarget)
          : dropdownContent;
      })()}
    </div>
  );
});

export default SelectField;
