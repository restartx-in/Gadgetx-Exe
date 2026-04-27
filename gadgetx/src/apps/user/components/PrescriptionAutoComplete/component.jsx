import { useState, useEffect, forwardRef, useRef, useMemo } from "react";
import { usePrescriptions } from "@/apps/user/hooks/api/prescription/usePrescriptions";
import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";

// Reusing styles from other autocompletes
import "./style.scss";

const PrescriptionAutoComplete = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label = "Prescription",
      placeholder = "Select prescription",
      required = false,
      disabled = false,
      className = "",
      filters = { page_size: 100 },
      style = {},
    },
    ref,
  ) => {
    const {
      data: prescriptions = [],
      isLoading,
      isError,
    } = usePrescriptions(filters);

    const [options, setOptions] = useState([]);

    useEffect(() => {
      if (Array.isArray(prescriptions)) {
        const mapped = prescriptions.map((p) => ({
          value: p.id,
          label: `${p.patient_name || "Prescription"} - ${p.date || ""} (${p.id})`,
        }));
        setOptions(mapped);
      }
    }, [prescriptions]);

    if (isLoading) {
      return (
        <CustomTextField
          label={`${label} (Loading)`}
          placeholder="Loading prescriptions..."
          disabled
          fullWidth
        />
      );
    }

    return (
      <PrescriptionSelectAutocompleteInput
        ref={ref}
        name={name}
        value={value}
        onChange={onChange}
        options={options}
        label={label}
        placeholder={placeholder}
        required={required}
        disabled={disabled || isLoading}
        className={className}
        style={style}
      />
    );
  },
);

const PrescriptionSelectAutocompleteInput = forwardRef(
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
    ref,
  ) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);

    useEffect(() => {
      const selected = options.find((opt) => String(opt.value) === String(value));
      setInputValue(selected ? selected.label : "");
    }, [value, options]);

    const filteredOptions = useMemo(() => {
      if (!inputValue) return options;
      return options.filter((opt) =>
        opt.label.toLowerCase().includes(inputValue.toLowerCase()),
      );
    }, [inputValue, options]);

    const handleInputChange = (e) => {
      const current = e.target.value;
      setInputValue(current);
      setActiveIndex(-1);
      setShowDropdown(true);
      if (current.length === 0) {
        onChange({ target: { name, value: "" } });
      }
    };

    const handleSelectOption = (option) => {
      onChange({ target: { name, value: option.value } });
      setInputValue(option.label);
      setShowDropdown(false);
    };

    const handleKeyDown = (e) => {
      if (disabled || !showDropdown) return;
      const itemsCount = filteredOptions.length;
      if (itemsCount === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % itemsCount);
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => (prev - 1 + itemsCount) % itemsCount);
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
      <div style={{ ...style, position: "relative" }}>
        <CustomTextField
          ref={ref}
          id={name}
          name={name}
          label={label}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
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
            className="customersinput-select__dropdown"
            activeIndex={activeIndex}
            as="ul"
          >
            {filteredOptions.map((opt, index) => (
              <li
                key={opt.value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectOption(opt);
                }}
                className={`customersinput-select__option ${index === activeIndex ? "active" : ""}`}
              >
                <div className="customersinput-select__option-content">
                  <span>{opt.label}</span>
                </div>
              </li>
            ))}
          </CustomScrollbar>
        )}
      </div>
    );
  },
);

PrescriptionAutoComplete.displayName = "PrescriptionAutoComplete";
export default PrescriptionAutoComplete;
