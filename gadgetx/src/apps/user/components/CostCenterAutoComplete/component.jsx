import { useState, useEffect, forwardRef, useRef, useMemo } from "react";
import { useCostCenters } from "@/apps/user/hooks/api/costCenter/useCostCenters";

import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";

import "./style.scss";

const CostCenterAutoComplete = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label = "Cost Center",
      placeholder = "Select a Cost Center",
      required = false,
      disabled = false,
      className = "",
      filters = {},
      style = {},
    },
    ref
  ) => {
    const {
      data: costCenters,
      isLoading,
      isError,
      error,
    } = useCostCenters(filters);
    const [costCenterOptions, setCostCenterOptions] = useState([]);

    useEffect(() => {
      if (costCenters) {
        const options = costCenters.map((costCenter) => ({
          value: costCenter.id,
          label: costCenter.name,
        }));
        setCostCenterOptions(options);
      }
    }, [costCenters]);

    if (isLoading) {
      return (
        <div className="costcenterinput-select">
          <CustomTextField
            label={label}
            placeholder="Loading cost centers..."
            disabled
            fullWidth
            variant="outlined"
          />
        </div>
      );
    }

    if (isError) {
      console.error("Failed to load cost centers:", error);
      return (
        <div className="costcenterinput-select">
          <CustomTextField
            label={label}
            placeholder="Error loading cost centers"
            disabled
            error
            fullWidth
            variant="outlined"
          />
        </div>
      );
    }

    return (
      <CostCenterSelectAutocompleteInput
        ref={ref}
        name={name}
        value={value}
        onChange={onChange}
        options={costCenterOptions}
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

export default CostCenterAutoComplete;

const CostCenterSelectAutocompleteInput = forwardRef(
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

    // Removed: dropdownRef and scroll useEffect (handled by CustomScrollbar)
    const hasBeenFocused = useRef(false);

    useEffect(() => {
      const selectedOption = options.find((opt) => opt.value === value);
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
        onChange({ target: { name, value: "" } });
      }
    };

    const handleSelectOption = (option) => {
      onChange({ target: { name, value: option.value } });
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
      if (disabled || !showDropdown || filteredOptions.length === 0) return;

      const itemsCount = filteredOptions.length;

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
        // className={`costcenterinput-select ${className}`}
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

        {showDropdown && (
          <CustomScrollbar
            className="costcenterinput-select__dropdown"
            activeIndex={activeIndex}
            as="ul"
          >
            {filteredOptions.length > 0
              ? filteredOptions.map((opt, index) => (
                  <li
                    key={opt.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectOption(opt);
                    }}
                    className={`costcenterinput-select__option ${
                      index === activeIndex ? "active" : ""
                    }`}
                  >
                    <div className="costcenterinput-select__option-content">
                      <span>{opt.label}</span>
                    </div>
                  </li>
                ))
              : inputValue && (
                  <li className="costcenterinput-select__option costcenterinput-select__option--disabled">
                    No matches found
                  </li>
                )}
          </CustomScrollbar>
        )}
      </div>
    );
  }
);
