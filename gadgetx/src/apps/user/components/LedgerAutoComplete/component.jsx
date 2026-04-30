import { useState, useEffect, forwardRef, useMemo, useRef } from "react";
import useLedgers from "@/apps/user/hooks/api/ledger/useLedger";
import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";

import "./style.scss";

const LedgerAutoComplete = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label = "Ledger",
      placeholder = "Select a Ledger",
      required = false,
      disabled = false,
      className = "",
      filters = {},
      style = {},
    },
    ref
  ) => {
    const { data: ledgers, isLoading, isError, error } =
      useLedgers(filters);

    const [ledgerOptions, setLedgerOptions] = useState([]);

    useEffect(() => {
      if (ledgers) {
        const options = ledgers.map((ledger) => ({
          value: ledger.id,
          label: ledger.name,
        }));

        setLedgerOptions(options);
      }
    }, [ledgers]);

    if (isLoading) {
      return (
        <div className="ledger-autocomplete">
          <CustomTextField
            label={label}
            placeholder="Loading ledgers..."
            disabled
            fullWidth
            variant="outlined"
          />
        </div>
      );
    }

    if (isError) {
      console.error("Failed to load ledgers:", error);

      return (
        <div className="ledger-autocomplete">
          <CustomTextField
            label={label}
            placeholder="Error loading ledgers"
            disabled
            error
            fullWidth
            variant="outlined"
          />
        </div>
      );
    }

    return (
      <LedgerSelectAutocompleteInput
        ref={ref}
        name={name}
        value={value}
        onChange={onChange}
        options={ledgerOptions}
        label={label}
        placeholder={placeholder}
        required={required}
        disabled={disabled || isLoading}
        className={className}
        style={style}
      />
    );
  }
);

export default LedgerAutoComplete;

// ----------------------------------------------------------------------
// UI Component
// ----------------------------------------------------------------------

const LedgerSelectAutocompleteInput = forwardRef(
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
      const selectedOption = options.find(
        (opt) => opt.value === value
      );

      setInputValue(selectedOption ? selectedOption.label : "");
    }, [value, options]);

    const filteredOptions = useMemo(() => {
      if (!inputValue) {
        return options;
      }

      return options.filter((opt) =>
        opt.label.toLowerCase().includes(inputValue.toLowerCase())
      );
    }, [inputValue, options]);

    const handleInputChange = (e) => {
      const currentInput = e.target.value;

      setInputValue(currentInput);
      setActiveIndex(-1);
      setShowDropdown(true);

      if (currentInput.length === 0) {
        onChange({
          target: {
            name,
            value: "",
          },
        });
      }
    };

    const handleSelectOption = (option) => {
      onChange({
        target: {
          name,
          value: option.value,
          selectedOption: option,
        },
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
      if (!showDropdown) return;

      const itemsCount = filteredOptions.length;

      if (itemsCount === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();

          setActiveIndex(
            (prevIndex) => (prevIndex + 1) % itemsCount
          );

          break;

        case "ArrowUp":
          e.preventDefault();

          setActiveIndex(
            (prevIndex) =>
              (prevIndex - 1 + itemsCount) % itemsCount
          );

          break;

        case "Enter":
          if (activeIndex < 0) return;

          e.preventDefault();

          handleSelectOption(filteredOptions[activeIndex]);

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
        className={`ledger-autocomplete ${className}`}
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
          onBlur={() =>
            setTimeout(() => {
              setShowDropdown(false);

              const selectedOption = options.find(
                (opt) => opt.value === value
              );

              setInputValue(
                selectedOption ? selectedOption.label : ""
              );
            }, 200)
          }
          {...rest}
        />

        {showDropdown && (
          <CustomScrollbar
            className="ledger-autocomplete__dropdown"
            activeIndex={activeIndex}
            as="ul"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => (
                <li
                  key={opt.value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectOption(opt);
                  }}
                  className={`ledger-autocomplete__option ${
                    index === activeIndex ? "active" : ""
                  }`}
                >
                  <div className="ledger-autocomplete__option-content">
                    <span>{opt.label}</span>
                  </div>
                </li>
              ))
            ) : (
              <li className="ledger-autocomplete__option ledger-autocomplete__option--no-results">
                No ledgers found
              </li>
            )}
          </CustomScrollbar>
        )}
      </div>
    );
  }
);