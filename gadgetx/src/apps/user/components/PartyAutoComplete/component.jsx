import { useState, useEffect, forwardRef, useRef } from "react";
import { useParties } from "@/hooks/api/party/useParties";  
import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";
import "./style.scss";  

const PartyAutoComplete = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label = "Party", // Default label changed to "Party"
      placeholder = "Select a Party", // Default placeholder changed
      required = false,
      disabled = false,
      className = "",
      filters = {},
      style = {},
    },
    ref
  ) => {
    // Use the useParties hook to fetch data
    const { data: parties, isLoading, isError, error } = useParties(filters);
    const [partyOptions, setPartyOptions] = useState([]);

    // Effect to map the fetched parties to the options format
    useEffect(() => {
      if (parties) {
        const options = parties.map((party) => ({
          value: party.id,
          label: party.name,
          ledger_id: party.ledger_id,
        }));
        setPartyOptions(options);
      }
    }, [parties]);

    // Display a loading state
    if (isLoading) {
      return (
        <div className="partyinput-select">
          <CustomTextField
            label={label}
            placeholder="Loading parties..."
            disabled
            fullWidth
            variant="outlined"
          />
        </div>
      );
    }

    // Display an error state
    if (isError) {
      console.error("Failed to load parties:", error);
      return (
        <div className="partyinput-select">
          <CustomTextField
            label={label}
            placeholder="Error loading parties"
            disabled
            error
            fullWidth
            variant="outlined"
          />
        </div>
      );
    }

    // Render the autocomplete input component
    return (
      <PartySelectAutocompleteInput
        ref={ref}
        name={name}
        value={value}
        onChange={onChange}
        options={partyOptions}
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

export default PartyAutoComplete;

// Internal component for handling the input and dropdown logic
const PartySelectAutocompleteInput = forwardRef(
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
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);
    
    const hasBeenFocused = useRef(false);

    // Update the input field text when the selected value changes
    useEffect(() => {
      const selectedOption = options.find((opt) => opt.value === value);
      setInputValue(selectedOption ? selectedOption.label : "");
    }, [value, options]);

    // Handle user input and filter options accordingly
    const handleInputChange = (e) => {
      const currentInput = e.target.value;
      setInputValue(currentInput);
      setActiveIndex(-1);
      setShowDropdown(true);

      if (currentInput.length === 0) {
        setFilteredOptions(options);
        onChange(null);
      } else {
        const matches = options.filter((opt) =>
          opt.label.toLowerCase().includes(currentInput.toLowerCase())
        );
        setFilteredOptions(matches);
      }
    };

    // Handle selecting an option from the dropdown
    const handleSelectOption = (option) => {
      onChange({
        party_id: option.value,
        ledger_id: option.ledger_id,
      });
      setInputValue(option.label);
      setShowDropdown(false);
    };

    const handleFocus = () => {
      if (hasBeenFocused.current) {
        setFilteredOptions(options);
        setShowDropdown(true);
      }
      hasBeenFocused.current = true;
    };

    const handleInputClick = () => {
        setFilteredOptions(options);
        setShowDropdown(true);
    };
    
    // Handle keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)
    const handleKeyDown = (e) => {
      if (!showDropdown) return;
      
      const itemsCount = filteredOptions.length;
      if (itemsCount === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prevIndex) => 
            prevIndex < itemsCount - 1 ? prevIndex + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prevIndex) => 
            prevIndex > 0 ? prevIndex - 1 : itemsCount - 1
          );
          break;
        case "Enter":
          if (activeIndex < 0) return;
          e.preventDefault();
          if (activeIndex < filteredOptions.length) {
            handleSelectOption(filteredOptions[activeIndex]);
          }
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
        style={{ ...style, position: "relative" }}
        className={className}
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
          onClick={handleInputClick}
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
            className="partyinput-select__dropdown"
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
                  className={`partyinput-select__option ${
                    index === activeIndex ? "active" : ""
                  }`}
                >
                  <div className="partyinput-select__option-content">
                    <span>{opt.label}</span>
                  </div>
                </li>
              ))
            ) : (
              <li
                className="partyinput-select__option"
                style={{ cursor: "default", color: "#94a3b8" }}
              >
                No parties found
              </li>
            )}
          </CustomScrollbar>
        )}
      </div>
    );
  }
);