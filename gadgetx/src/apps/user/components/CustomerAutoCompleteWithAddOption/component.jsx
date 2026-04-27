import { useState, useEffect, forwardRef, useRef, useMemo } from "react";
import { useCustomers } from "@/apps/user/hooks/api/customer/useCustomers";
import AddCustomer from "@/apps/user/pages/List/CustomerList/components/AddCustomer";
import { HiPencil, HiUser, HiPhone, HiCalendarDays } from "react-icons/hi2";

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
          phone: customer.phone || "No phone",
          serial: customer.serial_number || customer.id,
          date: customer.updated_at || customer.created_at,
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
      const customerToEdit = customers.find((c) => c.id === option.value);
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
      if (newCustomer?.id) {
        refetch();
        onChange({ target: { name, value: newCustomer.id } });
      }
      handleCloseModal();
    };

    if (isLoading)
      return (
        <CustomTextField
          label="Customer"
          placeholder="Loading..."
          disabled
          fullWidth
        />
      );

    return (
      <div className="customersinput-select-container">
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
         key={selectedCustomerInModal ? selectedCustomerInModal.name : 'new'} 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          selectedCustomer={selectedCustomerInModal}
          onCustomerCreated={handleCustomerCreated}
          onCustomerUpdated={() => {
            refetch();
            handleCloseModal();
          }}
        />
      </div>
    );
  }
);

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
    const hasBeenFocused = useRef(false);

    useEffect(() => {
      const selectedOption = options.find(
        (opt) => String(opt.value) === String(value)
      );
      setInputValue(selectedOption ? selectedOption.label : "");
    }, [value, options]);

    const filteredOptions = useMemo(() => {
      if (!inputValue) return options;
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

    const handleKeyDown = (e) => {
      if (disabled || !showDropdown) return;
      const totalItems = filteredOptions.length + (showAddNewOption ? 1 : 0);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % totalItems);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        if (activeIndex < filteredOptions.length) {
          handleSelectOption(filteredOptions[activeIndex]);
        } else {
          onAddNew(inputValue);
          setShowDropdown(false);
        }
      } else if (e.key === "Escape") {
        setShowDropdown(false);
      }
    };

    const handleSelectOption = (option) => {
      onChange({ target: { name, value: option.value } });
      setInputValue(option.label);
      setShowDropdown(false);
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return "N/A";
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    return (
      <div
        className="customersinput-select"
        style={{ ...style, position: "relative" }}
      >
        <CustomTextField
          ref={ref}
          name={name}
          label={label}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
            if (!e.target.value) onChange({ target: { name, value: "" } });
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (hasBeenFocused.current) setShowDropdown(true);
            hasBeenFocused.current = true;
          }}
          onClick={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          fullWidth
          {...rest}
        />

        {showDropdown && (
          <div className="customersinput-select__dropdown-wrapper">
            <div className="dropdown-header-info">
              <span>RECENTLY SAVED CUSTOMERS</span>
              <span className="count">{filteredOptions.length} found</span>
            </div>
            <CustomScrollbar className="dropdown-scroll-area" as="div">
              <ul className="dropdown-list">
                {filteredOptions.map((opt, index) => (
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
                    <div className="customersinput-select__row">
                      <div className="customer-avatar">
                        <HiUser size={18} />
                      </div>
                      <div className="customer-info-main">
                        <div className="customer-name">{opt.label}</div>
                        <div className="customer-phone">
                          <HiPhone size={11} /> {opt.phone}
                        </div>
                      </div>
                      <div className="customer-meta">
                        <div className="serial-badge">ID: {opt.serial}</div>
                        <div className="last-seen">
                          <HiCalendarDays size={11} /> {formatDate(opt.date)}
                        </div>
                      </div>
                      {is_edit && (
                        <button
                          type="button"
                          className="customersinput-select__edit-button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            onEdit(opt);
                          }}
                        >
                          <HiPencil size={14} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
                {showAddNewOption && (
                  <li
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onAddNew(inputValue)
                      setShowDropdown(false);
                    }}
                    className={`customersinput-select__option--add ${
                      activeIndex === filteredOptions.length ? "active" : ""
                    }`}
                  >
                     Add New Customer : <strong>{inputValue}</strong>
                  </li>
                )}
              </ul>
            </CustomScrollbar>
          </div>
        )}
      </div>
    );
  }
);

export default CustomerAutoCompleteWithAddOption;