import { useState, useEffect, forwardRef, useRef, useMemo } from "react";
import { useCustomers } from "@/hooks/api/customer/useCustomers";
import AddCustomer from "@/apps/user/pages/List/CustomerList/components/AddCustomer";
import { HiPencil } from "react-icons/hi2";

import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";

import "./style.scss";

const CustomerAutoCompleteWithAddOption = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label = "Customer",
      placeholder = "Select or add a customer",
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
      data: customers,
      isLoading,
      isError,
      error,
      refetch,
    } = useCustomers(filters);

    const [customerOptions, setCustomerOptions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [selectedCustomerInModal, setSelectedCustomerInModal] =
      useState(null);

    useEffect(() => {
      if (customers) {
        const options = customers.map((customer) => ({
          value: customer.id,
          label: customer.name,
        }));
        setCustomerOptions(options);
      }
    }, [customers]);

    const handleAddNew = (typedValue) => {
      setSelectedCustomerInModal({ name: typedValue });
      setModalMode("add");
      setIsModalOpen(true);
    };

    const handleEdit = (option) => {
      const customerToEdit = customers.find(
        (customer) => customer.id === option.value
      );
      if (customerToEdit) {
        setSelectedCustomerInModal(customerToEdit);
        setModalMode("edit");
        setIsModalOpen(true);
      }
    };

    const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedCustomerInModal(null);
    };

    const handleCustomerCreated = (newCustomer) => {
      if (newCustomer && newCustomer.id) {
        refetch();
        onChange({ target: { name, value: newCustomer.id } });
      }
      handleCloseModal();
    };

    const handleCustomerUpdated = () => {
      refetch();
      handleCloseModal();
    };

    if (isLoading) {
      return (
        <div className="customersinput-select">
          <CustomTextField
            label="Customer (Loading)"
            placeholder="Loading customers..."
            disabled
            fullWidth
            variant="outlined"
          />
        </div>
      );
    }

    if (isError) {
      console.error("Failed to load customers:", error);
      return (
        <div className="customersinput-select">
          <CustomTextField
            label={label}
            placeholder="Error loading customers"
            disabled
            fullWidth
            variant="outlined"
            error
          />
        </div>
      );
    }

    return (
      <>
        <CustomerSelectAutocompleteInput
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          options={customerOptions}
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
        <AddCustomer
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          selectedCustomer={selectedCustomerInModal}
          onCustomerCreated={handleCustomerCreated}
          onCustomerUpdated={handleCustomerUpdated}
        />
      </>
    );
  }
);
CustomerAutoCompleteWithAddOption.displayName =
  "CustomerAutoCompleteWithAddOption";

export default CustomerAutoCompleteWithAddOption;

const CustomerSelectAutocompleteInput = forwardRef(
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
    
    // Removed: dropdownRef and the manual scroll useEffect
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

    const handleAddNewClick = () => {
      if (onAddNew) {
        onAddNew(inputValue);
      }
      setShowDropdown(false);
    };

    const handleEditClick = (e, option) => {
      e.preventDefault(); // Prevent input blur
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
            handleAddNewClick();
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
            className="customersinput-select__dropdown"
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
                  className={`customersinput-select__option ${
                    index === activeIndex ? "active" : ""
                  }`}
                >
                  <div className="customersinput-select__option-content">
                    <span>{opt.label}</span>
                    {is_edit && !disabled && (
                      <button
                        type="button"
                        className="customersinput-select__edit-button"
                        onMouseDown={(e) => handleEditClick(e, opt)}
                      >
                        <HiPencil size={16} />
                      </button>
                    )}
                  </div>
                </li>
              ))
            ) : null}
            
            {showAddNewOption && (
              <li
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleAddNewClick();
                }}
                className={`customersinput-select__option customersinput-select__option--add ${
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

CustomerSelectAutocompleteInput.displayName = "CustomerSelectAutocompleteInput";