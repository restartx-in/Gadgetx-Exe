import { useState, useEffect, forwardRef, useRef, useMemo } from "react";
import { useItem } from "@/apps/user/hooks/api/item/useItem";

import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";

import "./style.scss";

const ItemAutoComplete = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label = "Item",
      placeholder = "Select item",
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
      data: items,
      isLoading,
      isError,
      error,
    } = useItem(filters);

    const [options, setOptions] = useState([]);

    useEffect(() => {
      if (items) {
        setOptions(
          items.map((item) => ({
            value: item.id,
            label: item.name,
            original: item,
          }))
        );
      }
    }, [items]);

    if (isLoading) {
      return (
        <CustomTextField
          label={label}
          placeholder="Loading items..."
          disabled
          fullWidth
        />
      );
    }

    if (isError) {
      console.error("Failed to load items:", error);
      return (
        <CustomTextField
          label={label}
          placeholder="Error loading items"
          disabled
          error
          fullWidth
        />
      );
    }

    return (
      <ItemAutocompleteInput
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

ItemAutoComplete.displayName = "ItemAutoComplete";
export default ItemAutoComplete;

const ItemAutocompleteInput = forwardRef(
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
        onChange({ target: { name, value: "" } });
      }
    };

    const handleSelect = (option) => {
      onChange({ target: { name, value: option.value, item: option.original } });
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
        className={`iteminput-select ${className}`}
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
            className="iteminput-select__dropdown"
            activeIndex={activeIndex}
            as="ul"
          >
            {filteredOptions.map((opt, index) => (
              <li
                key={opt.value}
                className={`iteminput-select__option ${
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

ItemAutocompleteInput.displayName = "ItemAutocompleteInput";
