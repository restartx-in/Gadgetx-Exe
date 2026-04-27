import { useState, useEffect, forwardRef, useRef, useMemo } from "react";
import { useSuppliers } from "@/apps/user/hooks/api/supplier/useSuppliers";

import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";

import "./style.scss";

/**
 * SupplierAutocomplete
 * - Select existing suppliers only
 * - No Add / Edit options
 */
const SupplierAutocomplete = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label = "Supplier",
      placeholder = "Select supplier",
      required = false,
      disabled = false,
      className = "",
      filters = {},
      style = {},
      ...rest
    },
    ref
  ) => {
    const {
      data: suppliers,
      isLoading,
      isError,
      error,
    } = useSuppliers(filters);

    const [options, setOptions] = useState([]);

    useEffect(() => {
      if (suppliers) {
        setOptions(
          suppliers.map((supplier) => ({
            value: supplier.id,
            label: supplier.name,
            ledger_id: supplier.ledger_id, // MODIFIED: Include ledger_id
          }))
        );
      }
    }, [suppliers]);

    if (isLoading) {
      return (
        <CustomTextField
          label={label}
          placeholder="Loading suppliers..."
          disabled
          fullWidth
        />
      );
    }

    if (isError) {
      console.error("Failed to load suppliers:", error);
      return (
        <CustomTextField
          label={label}
          placeholder="Error loading suppliers"
          disabled
          error
          fullWidth
        />
      );
    }

    return (
      <SupplierAutocompleteInput
        ref={ref}
        name={name}
        value={value}
        onChange={onChange}
        options={options}
        label={label}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={className}
        style={style}
        {...rest}
      />
    );
  }
);

SupplierAutocomplete.displayName = "SupplierAutocomplete";
export default SupplierAutocomplete;

/* ========================================================= */
/* ================= INPUT COMPONENT ======================= */
/* ========================================================= */

const SupplierAutocompleteInput = forwardRef(
  (
    {
      name,
      value,
      onChange,
      options,
      label,
      placeholder = "",
      required = false,
      disabled = false,
      className = "",
      style = {},
      ...rest
    },
    ref
  ) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);

    const hasBeenFocused = useRef(false);

    useEffect(() => {
      const selected = options.find((opt) => opt.value === value);
      setInputValue(selected ? selected.label : "");
    }, [value, options]);

    const filteredOptions = useMemo(() => {
      if (!inputValue) return options;
      return options.filter((opt) =>
        opt.label.toLowerCase().includes(inputValue.toLowerCase())
      );
    }, [inputValue, options]);

    const handleInputChange = (e) => {
      const val = e.target.value;
      setInputValue(val);
      setActiveIndex(-1);
      setShowDropdown(true);

      if (!val) {
        // MODIFIED: Pass null when input is cleared (for the parent component to handle clearing state)
        onChange(null);
      }
    };

    const handleSelect = (option) => {
      // MODIFIED: Pass an object with supplier_id and ledger_id (as expected by the parent)
      onChange({
        supplier_id: option.value,
        ledger_id: option.ledger_id,
      });
      setInputValue(option.label);
      setShowDropdown(false);
    };

    const handleFocus = () => {
      if (hasBeenFocused.current) {
        setShowDropdown(true);
      }
      hasBeenFocused.current = true;
    };

    const handleKeyDown = (e) => {
      if (disabled || !showDropdown) return;

      const count = filteredOptions.length;
      if (count === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % count);
          break;

        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => (i - 1 + count) % count);
          break;

        case "Enter":
          if (activeIndex < 0) return;
          e.preventDefault();
          handleSelect(filteredOptions[activeIndex]);
          break;

        case "Escape":
          setShowDropdown(false);
          break;

        default:
          break;
      }
    };

    return (
      <div
        className={`supplierinput-select ${className}`}
        style={{ ...style, position: "relative" }}
      >
        <CustomTextField
          ref={ref}
          id={name}
          name={name}
          label={label}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onClick={() => setShowDropdown(true)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          fullWidth
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          {...rest}
        />

        {showDropdown && filteredOptions.length > 0 && (
          <CustomScrollbar
            className="supplierinput-select__dropdown"
            activeIndex={activeIndex}
            as="ul"
          >
            {filteredOptions.map((opt, index) => (
              <li
                key={opt.value}
                className={`supplierinput-select__option ${
                  index === activeIndex ? "active" : ""
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(opt);
                }}
              >
                {opt.label}
              </li>
            ))}
          </CustomScrollbar>
        )}
      </div>
    );
  }
);

SupplierAutocompleteInput.displayName = "SupplierAutocompleteInput";
