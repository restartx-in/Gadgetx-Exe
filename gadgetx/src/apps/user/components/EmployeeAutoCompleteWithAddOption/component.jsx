import React, { useState, useEffect, useRef, forwardRef, useMemo } from "react";
import useEmployees from "@/apps/user/hooks/api/employee/useEmployees";
import AddEmployee from "@/apps/user/pages/List/EmployeeList/components/AddEmployee";
import { HiPencil } from "react-icons/hi2";
import { useToast } from "@/context/ToastContext";

// 1. Import Custom Components
import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";

import "./style.scss";

const EmployeeAutoCompleteWithAddOption = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label = "Employee",
      placeholder = "Select or add an employee",
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
      data: employees,
      isLoading,
      isError,
      error,
      refetch,
    } = useEmployees(filters);

    const showToast = useToast();

    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [selectedEmployeeInModal, setSelectedEmployeeInModal] =
      useState(null);

    useEffect(() => {
      if (employees) {
        const options = employees.map((employee) => ({
          value: employee.id,
          label: `${employee.name} (${employee.email})`,
        }));
        setEmployeeOptions(options);
      }
    }, [employees]);

    const handleAddNew = (typedValue) => {
      setSelectedEmployeeInModal({ name: typedValue });
      setModalMode("add");
      setIsModalOpen(true);
    };

    const handleEdit = (option) => {
      const employeeToEdit = employees.find(
        (employee) => employee.id === option.value
      );
      if (employeeToEdit) {
        setSelectedEmployeeInModal(employeeToEdit);
        setModalMode("edit");
        setIsModalOpen(true);
      } else {
        showToast({
          type: "GENARAL",
          message: "Employee data not found for editing.",
          status: "ERROR",
        });
      }
    };

    const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedEmployeeInModal(null);
    };

    const handleSuccess = (responseData) => {
      refetch();

      if (responseData && responseData.id && modalMode === "add") {
        onChange({ target: { name, value: responseData.id } });
      }
      handleCloseModal();
    };

    if (isLoading) {
      return (
        <div className="employeeinput-select">
          <CustomTextField
            label={label}
            placeholder="Loading employees..."
            disabled
            fullWidth
            variant="outlined"
          />
        </div>
      );
    }

    if (isError) {
      console.error("Failed to load employees:", error);
      return (
        <div className="employeeinput-select">
          <CustomTextField
            label={label}
            placeholder="Error loading employees"
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
        <EmployeeSelectAutocompleteInput
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          options={employeeOptions}
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
        <AddEmployee
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          selectedEmployee={selectedEmployeeInModal}
          onSuccess={handleSuccess}
        />
      </>
    );
  }
);
EmployeeAutoCompleteWithAddOption.displayName =
  "EmployeeAutoCompleteWithAddOption";

export default EmployeeAutoCompleteWithAddOption;

const EmployeeSelectAutocompleteInput = forwardRef(
  (
    {
      name,
      value,
      onChange,
      options,
      label,
      placeholder = "Select or add an employee",
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

    // Removed: dropdownRef and scrolling useEffect
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
      e.preventDefault(); // Prevent blur
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
            className="employeeeinputs-select__dropdown"
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
                  className={`employeeeinputs-select__option ${
                    index === activeIndex ? "active" : ""
                  }`}
                >
                  <div className="employeeeinputs-select__option-content">
                    <span>{opt.label}</span>
                    {is_edit && !disabled && (
                      <button
                        type="button"
                        className="employeeeinputs-select__edit-button"
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
                className={`employeeeinputs-select__option employeeeinputs-select__option--add ${
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
EmployeeSelectAutocompleteInput.displayName = "EmployeeSelectAutocompleteInput";
