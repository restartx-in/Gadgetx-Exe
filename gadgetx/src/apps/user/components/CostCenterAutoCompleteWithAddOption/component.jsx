import { useState, useEffect, forwardRef, useRef, useMemo } from "react";
import { useCostCenters } from "@/hooks/api/costCenter/useCostCenters";
import AddCostCenter from "@/apps/user/pages/List/CostCenterList/components/AddCostCenter";
import { HiPencil } from "react-icons/hi2";

// 1. Import Custom Components
import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";

import "./style.scss";

const CostCenterAutoCompleteWithAddOption = forwardRef(
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
      is_edit = true,
      style = {},
    },
    ref
  ) => {
    const {
      data: costCenters,
      isLoading,
      isError,
      error,
      refetch,
    } = useCostCenters(filters);
    const [costCenterOptions, setCostCenterOptions] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [selectedCostCenterInModal, setSelectedCostCenterInModal] =
      useState(null);

    useEffect(() => {
      if (costCenters) {
        const options = costCenters.map((costCenter) => ({
          value: costCenter.id,
          label: costCenter.name,
        }));
        setCostCenterOptions(options);
      }
    }, [costCenters]);

    const handleAddNew = (typedValue) => {
      setSelectedCostCenterInModal({ name: typedValue });
      setModalMode("add");
      setIsModalOpen(true);
    };

    const handleEdit = (option) => {
      const costCenterToEdit = costCenters.find((cc) => cc.id === option.value);
      if (costCenterToEdit) {
        setSelectedCostCenterInModal(costCenterToEdit);
        setModalMode("edit");
        setIsModalOpen(true);
      }
    };

    const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedCostCenterInModal(null);
    };

    const onCostCenterCreated = (newCostCenter) => {
      if (newCostCenter && newCostCenter.id) {
        refetch();
        onChange({ target: { name, value: newCostCenter.id } });
        handleCloseModal();
      }
    };

    const onCostCenterUpdated = () => {
      refetch();
      handleCloseModal();
    };

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
      <>
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
          onAddNew={handleAddNew}
          onEdit={handleEdit}
          is_edit={is_edit && !disabled}
          style={style}
        />
        <AddCostCenter
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          selectedCostCenter={selectedCostCenterInModal}
          onCostCenterCreated={onCostCenterCreated}
          onCostCenterUpdated={onCostCenterUpdated}
        />
      </>
    );
  }
);

CostCenterAutoCompleteWithAddOption.displayName = "CostCenterAutoCompleteWithAddOption";

export default CostCenterAutoCompleteWithAddOption;

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
      onAddNew,
      onEdit,
      is_edit,
      style = {},
      ...rest
    },
    ref
  ) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);
    
    // REMOVED: dropdownRef and scrolling useEffect
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

    const handleAddNew = () => {
      if (onAddNew) {
        onAddNew(inputValue);
      }
      setShowDropdown(false);
    };

    const handleEditClick = (e, option) => {
      e.preventDefault();
      e.stopPropagation();
      if (onEdit) {
        onEdit(option);
        setShowDropdown(false);
      }
    };

    const handleFocus = () => {
      if (hasBeenFocused.current) {
        setShowDropdown(true);
      }
      hasBeenFocused.current = true;
    };

    const handleKeyDown = (e) => {
      if (disabled || !showDropdown) return;

      const showAddNew =
        onAddNew &&
        inputValue &&
        !filteredOptions.some(
          (opt) => opt.label.toLowerCase() === inputValue.toLowerCase()
        );
      const itemsCount = filteredOptions.length + (showAddNew ? 1 : 0);

      if (itemsCount === 0) return;

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
          if (activeIndex < filteredOptions.length) {
            handleSelectOption(filteredOptions[activeIndex]);
          } else if (showAddNew) {
            handleAddNew();
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
        // className={`costcenterinputs-select ${className}`} 
        style={{ ...style, position: 'relative' }}
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
            className="costcenterinputs-select__dropdown"
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
                className={`costcenterinputs-select__option ${
                  index === activeIndex ? "active" : ""
                }`}
              >
                <div className="costcenterinputs-select__option-content">
                  <span>{opt.label}</span>
                  {is_edit && !disabled && (
                    <button
                      type="button"
                      className="costcenterinputs-select__edit-button"
                      onMouseDown={(e) => handleEditClick(e, opt)}
                    >
                      <HiPencil size={15} />
                    </button>
                  )}
                </div>
              </li>
            ))}
            {onAddNew &&
              inputValue &&
              !filteredOptions.some(
                (opt) => opt.label.toLowerCase() === inputValue.toLowerCase()
              ) && (
                <li
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleAddNew();
                  }}
                  className={`costcenterinputs-select__option costcenterinputs-select__option--add ${
                    activeIndex === filteredOptions.length ? "active" : ""
                  }`}
                >
                  + Add "{inputValue}"
                </li>
              )}
          </CustomScrollbar>
        )}
      </div>
    );
  }
);
CostCenterSelectAutocompleteInput.displayName = "CostCenterSelectAutocompleteInput";