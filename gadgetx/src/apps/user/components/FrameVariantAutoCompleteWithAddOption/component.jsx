import { useState, useEffect, forwardRef, useRef, useMemo } from "react";
import { useFrameVariants } from "@/apps/user/hooks/api/frameVariant/useFrameVariants";
import AddFrameVariant from "@/apps/user/pages/List/FrameVariantList/components/AddFrameVariant";
import { HiPencil } from "react-icons/hi2";
import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";

import "./style.scss";

const FrameVariantAutoCompleteWithAddOption = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label = "Frame Variant",
      placeholder = "Select or add a variant",
      required = false,
      disabled = false,
      className = "",
      filters = { page_size: 100 },
      is_edit = true,
      style = {},
      frame_id = null,
    },
    ref,
  ) => {
    const combinedFilters = useMemo(() => ({
      ...filters,
      frame_id: frame_id || filters.frame_id,
    }), [filters, frame_id]);

    const {
      data: variants = [],
      isLoading,
      isError,
      refetch,
    } = useFrameVariants(combinedFilters);

    const [options, setOptions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [selectedInModal, setSelectedInModal] = useState(null);

    useEffect(() => {
      if (Array.isArray(variants)) {
        const mapped = variants.map((v) => ({
          value: v.id,
          label: `${v.frame_name || "Frame"} - ${v.sku} (${v.color || "No color"})`,
          price: Number(v.price || v.selling_price || 0),
          stock: v.stock_qty || 0,
        }));
        setOptions(mapped);
      }
    }, [variants]);

    const handleAddNew = (typedValue) => {
      setSelectedInModal({ sku: typedValue });
      setModalMode("add");
      setIsModalOpen(true);
    };

    const handleEdit = (option) => {
      const toEdit = variants.find((v) => v.id === option.value);
      if (toEdit) {
        setSelectedInModal(toEdit);
        setModalMode("edit");
        setIsModalOpen(true);
      }
    };

    const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedInModal(null);
    };

    const handleSuccess = (newV) => {
      refetch();
      if (newV && newV.id && modalMode === "add") {
        onChange({ target: { name, value: newV.id, option: newV, selected: newV } });
      }
      handleCloseModal();
    };

    if (isLoading) {
      return (
        <CustomTextField
          label={`${label} (Loading)`}
          placeholder="Loading variants..."
          disabled
          fullWidth
        />
      );
    }

    return (
      <>
        <VariantSelectAutocompleteInput
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
        <AddFrameVariant
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          selectedVariant={selectedInModal}
          onSuccess={handleSuccess}
        />
      </>
    );
  },
);

const VariantSelectAutocompleteInput = forwardRef(
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
      const selected = options.find((opt) => String(opt.value) === String(value));
      setInputValue(selected ? selected.label : "");
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
      const current = e.target.value;
      setInputValue(current);
      setActiveIndex(-1);
      setShowDropdown(true);
      if (current.length === 0) {
        onChange({ target: { name, value: "" } });
      }
    };

    const handleSelectOption = (option) => {
      onChange({ target: { name, value: option.value, option, selected: option } });
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
          setActiveIndex((prev) => (prev + 1) % itemsCount);
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => (prev - 1 + itemsCount) % itemsCount);
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
      <div className={`framevariants-select ${className}`} style={{ ...style, position: "relative" }}>
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
            className="framevariants-select__dropdown"
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
                className={`framevariants-select__option ${index === activeIndex ? "active" : ""}`}
              >
                <div className="framevariants-select__option-content">
                  <span>{opt.label}</span>
                  {is_edit && (
                    <button
                      type="button"
                      className="framevariants-select__edit-button"
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
                className={`framevariants-select__option framevariants-select__option--add ${activeIndex === filteredOptions.length ? "active" : ""
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

FrameVariantAutoCompleteWithAddOption.displayName = "FrameVariantAutoCompleteWithAddOption";
export default FrameVariantAutoCompleteWithAddOption;
