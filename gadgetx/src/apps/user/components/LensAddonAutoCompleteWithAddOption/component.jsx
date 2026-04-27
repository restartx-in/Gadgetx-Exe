import { useState, useEffect, forwardRef, useRef, useMemo } from "react";
import { useLensAddons } from "@/apps/user/hooks/api/lensAddon/useLensAddons";
import AddLensAddon from "@/apps/user/pages/List/LenseAddonsList/components/AddLensAddon";
import { HiPencil } from "react-icons/hi2";
import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";

import "./style.scss";

const LensAddonAutoCompleteWithAddOption = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label = "Lens Addon",
      placeholder = "Select or add an addon",
      required = false,
      disabled = false,
      className = "",
      filters = { pageSize: 100 },
      is_edit = true,
      style = {},
    },
    ref,
  ) => {
    const {
      data: addons = [],
      isLoading,
      isError,
      refetch,
    } = useLensAddons(filters);

    const [options, setOptions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [selectedInModal, setSelectedInModal] = useState(null);

    useEffect(() => {
      const addonList = Array.isArray(addons.data) ? addons.data : addons;
      if (Array.isArray(addonList)) {
        const mapped = addonList.map((a) => ({
          value: a.id,
          label: a.name,
          price: Number(a.price || 0),
        }));
        setOptions(mapped);
      }
    }, [addons]);

    const handleAddNew = (typedValue) => {
      setSelectedInModal({ name: typedValue });
      setModalMode("add");
      setIsModalOpen(true);
    };

    const handleEdit = (option) => {
      const addonList = Array.isArray(addons.data) ? addons.data : addons;
      const toEdit = addonList.find((a) => a.id === option.value);
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

    const handleSuccess = (newAddon) => {
      refetch();
      if (newAddon && newAddon.id && modalMode === "add") {
        onChange({
          target: {
            name,
            value: newAddon.id,
            option: newAddon,
            selected: newAddon,
          },
        });
      }
      handleCloseModal();
    };

    if (isLoading) {
      return (
        <CustomTextField
          label={`${label} (Loading)`}
          placeholder="Loading addons..."
          disabled
          fullWidth
        />
      );
    }

    return (
      <>
        <AddonSelectAutocompleteInput
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
        <AddLensAddon
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          selectedAddon={selectedInModal}
          onSuccess={handleSuccess}
        />
      </>
    );
  },
);

const AddonSelectAutocompleteInput = forwardRef(
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
            className="lensaddons-select__dropdown"
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
                className={`lensaddons-select__option ${index === activeIndex ? "active" : ""}`}
              >
                <div className="lensaddons-select__option-content">
                  <span>{opt.label}</span>
                  {is_edit && (
                    <button
                      type="button"
                      className="lensaddons-select__edit-button"
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

LensAddonAutoCompleteWithAddOption.displayName = "LensAddonAutoCompleteWithAddOption";
export default LensAddonAutoCompleteWithAddOption;
