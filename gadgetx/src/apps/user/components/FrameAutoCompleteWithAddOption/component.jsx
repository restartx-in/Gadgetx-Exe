import { useState, useEffect, forwardRef, useRef, useMemo } from "react";
import { useFramesPaginated } from "@/apps/user/hooks/api/frame/useFramesPaginated";
import AddFrame from "@/apps/user/pages/List/FrameList/components/AddFrame";
import { HiPencil } from "react-icons/hi2";

import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";

import "./style.scss"; // Use the same CSS file as customers

const FrameAutoCompleteWithAddOption = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label = "Frame",
      placeholder = "Select or add a frame",
      required = false,
      disabled = false,
      className = "",
      filters = { page_size: 100 }, // Increased page_size to show more options in autocomplete
      is_edit = true,
      style = {},
    },
    ref,
  ) => {
    // 1. Fetch Frames
    const {
      data: frames, // This is the object { data: [], count: 0, ... }
      isLoading,
      isError,
      refetch,
    } = useFramesPaginated(filters);

    const [frameOptions, setFrameOptions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [selectedFrameInModal, setSelectedFrameInModal] = useState(null);

    // 2. Map frames to options
    useEffect(() => {
      if (frames && Array.isArray(frames.data)) {
        const options = frames.data.map((frame) => ({
          value: frame.id,
          label: `${frame.name} ${frame.model_no ? `(${frame.model_no})` : ""}`,
        }));
        setFrameOptions(options);
      }
    }, [frames]);

    const handleAddNew = (typedValue) => {
      setSelectedFrameInModal({ name: typedValue });
      setModalMode("add");
      setIsModalOpen(true);
    };

    const handleEdit = (option) => {
      const frameToEdit = frames?.data?.find((f) => f.id === option.value);
      if (frameToEdit) {
        setSelectedFrameInModal(frameToEdit);
        setModalMode("edit");
        setIsModalOpen(true);
      }
    };

    const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedFrameInModal(null);
    };

    const handleSuccess = (newFrame) => {
      refetch();
      if (newFrame && newFrame.id && modalMode === "add") {
        onChange({ target: { name, value: newFrame.id } });
      }
      handleCloseModal();
    };

    if (isLoading) {
      return (
        <div className="customersinput-select">
          <CustomTextField
            label={`${label} (Loading)`}
            placeholder="Loading frames..."
            disabled
            fullWidth
          />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="customersinput-select">
          <CustomTextField
            label={label}
            placeholder="Error loading frames"
            disabled
            fullWidth
            error
          />
        </div>
      );
    }

    return (
      <>
        <FrameSelectAutocompleteInput
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          options={frameOptions}
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
        <AddFrame
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          selectedFrame={selectedFrameInModal}
          onSuccess={handleSuccess}
        />
      </>
    );
  },
);

FrameAutoCompleteWithAddOption.displayName = "FrameAutoCompleteWithAddOption";

export default FrameAutoCompleteWithAddOption;

// Inner Input UI Component
const FrameSelectAutocompleteInput = forwardRef(
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
                + Add "{inputValue}"
              </li>
            )}
          </CustomScrollbar>
        )}
      </div>
    );
  },
);

FrameSelectAutocompleteInput.displayName = "FrameSelectAutocompleteInput";
