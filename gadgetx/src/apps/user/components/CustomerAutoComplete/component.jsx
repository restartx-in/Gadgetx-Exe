import { useState, useEffect, forwardRef, useRef, useMemo } from "react";
import { useCustomers } from "@/apps/user/hooks/api/customer/useCustomers";
// Assuming AddCustomer and HiPencil are not in this file, keeping the structure generic
// import AddCustomer from "@/apps/user/pages/List/CustomerList/components/AddCustomer";
// import { HiPencil } from "react-icons/hi2";

import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";

// ASSUMED: A separate style file for customers or combined style file
import "./style.scss";

/**
 * CustomerAutocomplete
 * - Select existing customers only
 * - No Add / Edit options
 */
const CustomerAutocomplete = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label = "Customer",
      placeholder = "Select customer",
      required = false,
      disabled = false,
      className = "",
      filters = {},
      style = {},
      ...rest
    },
    ref
  ) => {
    // MODIFIED: Use useCustomers hook
    const {
      data: customers,
      isLoading,
      isError,
      error,
    } = useCustomers(filters);

    const [options, setOptions] = useState([]);

    useEffect(() => {
      if (customers) {
        setOptions(
          customers.map((customer) => ({
            // MODIFIED: Map customers
            value: customer.id,
            label: customer.name,
            ledger_id: customer.ledger_id, // Keep ledger_id for consistency
          }))
        );
      }
    }, [customers]);

    if (isLoading) {
      return (
        <CustomTextField
          label={label}
          placeholder="Loading customers..." // MODIFIED
          disabled
          fullWidth
        />
      );
    }

    if (isError) {
      console.error("Failed to load customers:", error); // MODIFIED
      return (
        <CustomTextField
          label={label}
          placeholder="Error loading customers" // MODIFIED
          disabled
          error
          fullWidth
        />
      );
    }

    return (
      <CustomerAutocompleteInput // MODIFIED
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

CustomerAutocomplete.displayName = "CustomerAutocomplete";
export default CustomerAutocomplete;

/* ========================================================= */
/* ================= INPUT COMPONENT ======================= */
/* ========================================================= */

const CustomerAutocompleteInput = forwardRef(
  // MODIFIED
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
        onChange({ target: { value: "" } });
      }
    };

    const handleSelect = (option) => {
      onChange({ target: { value: option.value } });
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
        className={`customerinput-select ${className}`} // MODIFIED: New main class name
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
            className="customerinput-select__dropdown" // MODIFIED: New dropdown class
            activeIndex={activeIndex}
            as="ul"
          >
            {filteredOptions.map((opt, index) => (
              <li
                key={opt.value}
                className={`customerinput-select__option ${
                  // MODIFIED: New option class
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

CustomerAutocompleteInput.displayName = "CustomerAutocompleteInput"; // MODIFIED
