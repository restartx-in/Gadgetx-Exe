import { useState, useEffect, forwardRef, useRef, useMemo } from "react";
import { useExpenseTypes } from "@/apps/user/hooks/api/expenseType/useExpenseTypes";
import AddExpenseType from "@/apps/user/pages/List/ExpenseTypeList/components/AddExpenseType";
import { HiPencil } from "react-icons/hi2";

// 1. Import Custom Components
import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";

import "./style.scss";

const ExpenseTypeAutoCompleteWithAddOption = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label = "Expense Type",
      placeholder = "Select or add an expense type",
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
      data: expenseTypes,
      isLoading,
      isError,
      error,
      refetch,
    } = useExpenseTypes(filters);
    const [expenseTypeOptions, setExpenseTypeOptions] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [selectedExpenseTypeInModal, setSelectedExpenseTypeInModal] =
      useState(null);

    useEffect(() => {
      if (expenseTypes) {
        const options = expenseTypes.map((expenseType) => ({
          value: expenseType.id,
          label: expenseType.name,
        }));
        setExpenseTypeOptions(options);
      }
    }, [expenseTypes]);

    const handleAddNew = (typedValue) => {
      setSelectedExpenseTypeInModal({ name: typedValue });
      setModalMode("add");
      setIsModalOpen(true);
    };

    const handleEdit = (option) => {
      const expenseTypeToEdit = expenseTypes.find(
        (type) => type.id === option.value
      );
      if (expenseTypeToEdit) {
        setSelectedExpenseTypeInModal(expenseTypeToEdit);
        setModalMode("edit");
        setIsModalOpen(true);
      }
    };

    const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedExpenseTypeInModal(null);
    };

    const handleExpenseTypeCreated = (newExpenseType) => {
      if (newExpenseType && newExpenseType.id) {
        refetch();
        onChange({ target: { name, value: newExpenseType.id } });
      }
      handleCloseModal();
    };

    const handleExpenseTypeUpdated = () => {
      refetch();
      handleCloseModal();
    };

    if (isLoading) {
      return (
        <div className="expensetypeinput-select">
          <CustomTextField
            label={label}
            placeholder="Loading expense types..."
            disabled
            fullWidth
            variant="outlined"
          />
        </div>
      );
    }

    if (isError) {
      console.error("Failed to load expense types:", error);
      return (
        <div className="expensetypeinput-select">
          <CustomTextField
            label={label}
            placeholder="Error loading expense types"
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
        <ExpenseTypeSelectAutocompleteInput
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          options={expenseTypeOptions}
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
        <AddExpenseType
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          selectedExpenseType={selectedExpenseTypeInModal}
          onExpenseTypeCreated={handleExpenseTypeCreated}
          onExpenseTypeUpdated={handleExpenseTypeUpdated}
        />
      </>
    );
  }
);
ExpenseTypeAutoCompleteWithAddOption.displayName =
  "ExpenseTypeAutoCompleteWithAddOption";

export default ExpenseTypeAutoCompleteWithAddOption;

const ExpenseTypeSelectAutocompleteInput = forwardRef(
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

    const exactMatchExists = useMemo(
      () =>
        options.some(
          (opt) => opt.label.toLowerCase() === inputValue.toLowerCase().trim()
        ),
      [inputValue, options]
    );

    const showAddNewOption = inputValue && !exactMatchExists && onAddNew;

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

      const itemsCount = filteredOptions.length + (showAddNewOption ? 1 : 0);
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
          } else if (showAddNewOption) {
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
      <div style={{ ...style, position: "relative" }}>
        <CustomTextField
          ref={ref}
          id={name}
          name={name}
          label={label}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onClick={() => {
            setShowDropdown(true);
          }}
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
            className="expensetypeinput-select__dropdown"
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
                  className={`expensetypeinput-select__option ${
                    index === activeIndex ? "active" : ""
                  }`}
                >
                  <div className="expensetypeinput-select__option-content">
                    <span>{opt.label}</span>
                    {is_edit && !disabled && (
                      <button
                        type="button"
                        className="expensetypeinput-select__edit-button"
                        onMouseDown={(e) => handleEditClick(e, opt)}
                      >
                        <HiPencil size={15} />
                      </button>
                    )}
                  </div>
                </li>
              ))
            ) : showAddNewOption ? (
              <li
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleAddNew();
                }}
                className={`expensetypeinput-select__option expensetypeinput-select__option--add ${
                  activeIndex === 0 ? "active" : ""
                }`}
              >
                + Add "{inputValue}"
              </li>
            ) : null}
          </CustomScrollbar>
        )}
      </div>
    );
  }
);

ExpenseTypeSelectAutocompleteInput.displayName =
  "ExpenseTypeSelectAutocompleteInput";
