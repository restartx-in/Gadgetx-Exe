import { useState, useEffect, forwardRef, useRef, useMemo } from "react";
import { useItem } from "@/hooks/api/item/useItem";
import AddItem from "@/apps/user/pages/List/ItemList/components/AddItem";
import { HiPencil } from "react-icons/hi2";

// 1. Import Custom Components
import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";

import "./style.scss";

const ItemAutoCompleteWithAddOption = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label="Select Item",
      placeholder = "Select or add an item",
      required = false,
      disabled = false,
      className = "",
      filters = {},
      is_edit = true,
      style = {}
    },
    ref
  ) => {
    const {
      data: items,
      isLoading,
      isError,
      error,
      refetch,
    } = useItem(filters);
    const [itemOptions, setItemOptions] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [selectedItemInModal, setSelectedItemInModal] = useState(null);

    useEffect(() => {
      if (items) {
        const options = items.map((item) => ({
          value: item.id,
          label: item.name,
        }));
        setItemOptions(options);
      }
    }, [items]);

    const handleAddNew = (typedValue) => {
      setSelectedItemInModal({ name: typedValue });
      setModalMode("add");
      setIsModalOpen(true);
    };

    const handleEdit = (option) => {
      const itemToEdit = items.find((item) => item.id === option.value);
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

    const handleItemCreated = (newItem) => {
      if (newItem && newItem.id) {
        refetch();
        onChange({ target: { name, value: newItem.id } });
      }
      handleCloseModal();
    };

    const handleItemUpdated = () => {
      refetch();
      handleCloseModal();
    };

    if (isLoading) {
      return (
        <div className="iteminput-select">
          <CustomTextField 
            label={label}
            placeholder="Loading items..."
            disabled
            fullWidth
            variant="outlined"
          />
        </div>
      );
    }

    if (isError) {
      console.error("Failed to load items:", error);
      return (
        <div className="iteminput-select">
          <CustomTextField 
            label={label}
            placeholder="Error loading items"
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
        <ItemSelectAutocompleteInput
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          options={itemOptions}
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
        <AddItem
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          selectedItem={selectedItemInModal}
          onItemCreated={handleItemCreated}
          onItemUpdated={handleItemUpdated}
        />
      </>
    );
  }
);
ItemAutoCompleteWithAddOption.displayName = "ItemAutoCompleteWithAddOption";

export default ItemAutoCompleteWithAddOption;

const ItemSelectAutocompleteInput = forwardRef(
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
      <div 
        className={`iteminput-select ${className}`}
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
            className="iteminput-select__dropdown"
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
                  className={`iteminput-select__option ${
                    index === activeIndex ? "active" : ""
                  }`}
                >
                  <div className="iteminput-select__option-content">
                    <span>{opt.label}</span>
                    {is_edit && !disabled && (
                      <button
                        type="button"
                        className="iteminput-select__edit-button"
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
                className={`iteminput-select__option iteminput-select__option--add ${
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
ItemSelectAutocompleteInput.displayName = "ItemSelectAutocompleteInput";