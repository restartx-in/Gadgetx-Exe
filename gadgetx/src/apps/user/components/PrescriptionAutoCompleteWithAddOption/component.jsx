import { useState, useEffect, forwardRef, useRef, useMemo } from "react";
import { usePrescriptions } from "@/apps/user/hooks/api/prescription/usePrescriptions";
import AddPrescription from "@/apps/user/pages/List/PrescriptionList/components/AddPrescription/component";
import { HiPencil } from "react-icons/hi2";

import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";

import "./style.scss";

const PrescriptionAutoCompleteWithAddOption = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label = "Prescription",
      placeholder = "Select or add a prescription",
      required = false,
      disabled = false,
      className = "",
      filters = { page_size: 100 },
      is_edit = true,
      style = {},
    },
    ref,
  ) => {
    const {
      data: prescriptions = [],
      isLoading,
      isError,
      refetch,
    } = usePrescriptions(filters);

    const [options, setOptions] = useState([]);
    const [isIdIncludedInOptions, setIsIdIncludedInOptions] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [selectedItemInModal, setSelectedItemInModal] = useState(null);

    useEffect(() => {
      if (Array.isArray(prescriptions)) {
        const mapped = prescriptions.map((p) => ({
          value: p.id,
          label: `${p.patient_name || "Prescription"} - ${p.date || ""} (${p.id})`,
        }));
        setOptions(mapped);
        setIsIdIncludedInOptions(mapped.some(opt => String(opt.value) === String(value)));
      }
    }, [prescriptions, value]);

    const handleAddNew = (typedValue) => {
      // If we have filters.party_id, pre-select that customer
      const defaultData = filters.party_id || filters.customer_id ? { customer_id: filters.party_id || filters.customer_id } : {};
      setSelectedItemInModal(defaultData);
      setModalMode("add");
      setIsModalOpen(true);
    };

    const handleEdit = (option) => {
      const itemToEdit = prescriptions.find((p) => p.id === option.value);
      if (itemToEdit) {
        setSelectedItemInModal(itemToEdit);
        setModalMode("edit");
        setIsModalOpen(true);
      }
    };

    const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedItemInModal(null);
    };

    const handleSuccess = (newItem) => {
      refetch();
      if (newItem && newItem.id && modalMode === "add") {
        onChange({ target: { name, value: newItem.id } });
      }
      handleCloseModal();
    };

    if (isLoading && !isIdIncludedInOptions) {
      return (
        <div className="customersinput-select">
          <CustomTextField
            label={`${label} (Loading)`}
            placeholder="Loading prescriptions..."
            disabled
            fullWidth
          />
        </div>
      );
    }

    return (
      <>
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
          onAddNew={handleAddNew}
          onEdit={handleEdit}
          is_edit={is_edit && !disabled}
          style={style}
        />
        <AddPrescription
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          selectedItem={selectedItemInModal}
          onSuccess={handleSuccess}
        />
      </>
    );
  },
);

PrescriptionAutoCompleteWithAddOption.displayName = "PrescriptionAutoCompleteWithAddOption";

export default PrescriptionAutoCompleteWithAddOption;

// Inner Input UI Component
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
      onAddNew,
      onEdit,
      is_edit,
      style = {},
      ...rest
    },
    ref,
  ) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);
    const hasBeenFocused = useRef(false);

    useEffect(() => {
      const selectedOption = options.find(
        (opt) => String(opt.value) === String(value),
      );
      setInputValue(selectedOption ? selectedOption.label : "");
    }, [value, options]);

    const filteredOptions = useMemo(() => {
      if (!inputValue) return options;
      return options.filter((opt) =>
        opt.label.toLowerCase().includes(inputValue.toLowerCase()),
      );
    }, [inputValue, options]);

    const exactMatchExists = useMemo(
      () =>
        options.some(
          (opt) => opt.label.toLowerCase() === inputValue.toLowerCase().trim(),
        ),
      [inputValue, options],
    );

    const showAddNewOption = !disabled && onAddNew; // Showing add option even without typing if needed, but standard is typing

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
            (prevIndex) => (prevIndex - 1 + itemsCount) % itemsCount,
          );
          break;
        case "Enter":
          if (activeIndex < 0) return;
          e.preventDefault();
          if (activeIndex < filteredOptions.length) {
            handleSelectOption(filteredOptions[activeIndex]);
          } else if (showAddNewOption) {
            onAddNew(inputValue);
            setShowDropdown(false);
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
          onFocus={() => {
            if (hasBeenFocused.current) setShowDropdown(true);
            hasBeenFocused.current = true;
          }}
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
                  {is_edit && (
                    <button
                      type="button"
                      className="customersinput-select__edit-button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEdit(opt);
                        setShowDropdown(false);
                      }}
                    >
                      <HiPencil size={16} />
                    </button>
                  )}
                </div>
              </li>
            ))}

            {showAddNewOption && (
              <li
                onMouseDown={(e) => {
                  e.preventDefault();
                  onAddNew(inputValue);
                  setShowDropdown(false);
                }}
                className={`customersinput-select__option customersinput-select__option--add ${
                  activeIndex === filteredOptions.length ? "active" : ""
                }`}
              >
                + Add {inputValue ? `"${inputValue}"` : "New Prescription"}
              </li>
            )}
          </CustomScrollbar>
        )}
      </div>
    );
  },
);

PrescriptionSelectAutocompleteInput.displayName = "PrescriptionSelectAutocompleteInput";
