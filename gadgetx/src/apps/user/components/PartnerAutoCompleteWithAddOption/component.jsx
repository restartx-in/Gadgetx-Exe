import { useState, useEffect, forwardRef, useRef, useMemo } from 'react';
import { usePartners } from '@/hooks/api/partner/usePartners';
import AddPartner from '@/apps/user/pages/List/PartnerList/components/AddPartner';
import { HiPencil } from 'react-icons/hi2';

// 1. Import Custom Components
import CustomTextField from '@/components/CustomTextField';
import CustomScrollbar from '@/components/CustomScrollbar';

import './style.scss';

const PartnerAutoCompleteWithAddOption = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label='Partner',
      placeholder = 'Select or add a partner',
      required = false,
      disabled = false,
      className = '',
      filters = {},
      is_edit = true,
      style = {},
    },
    ref,
  ) => {
    const { data: partners, isLoading, isError, error, refetch } = usePartners(filters);
    const [partnerOptions, setPartnerOptions] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedPartnerInModal, setSelectedPartnerInModal] = useState(null);

    useEffect(() => {
      if (partners) {
        const options = partners.map((partner) => ({
          value: partner.id,
          label: partner.name,
        }));
        setPartnerOptions(options);
      }
    }, [partners]);

    const handleAddNew = (typedValue) => {
      setSelectedPartnerInModal({ name: typedValue });
      setModalMode('add');
      setIsModalOpen(true);
    };

    const handleEdit = (option) => {
      const partnerToEdit = partners.find(
        (partner) => partner.id === option.value,
      );
      if (partnerToEdit) {
        setSelectedPartnerInModal(partnerToEdit);
        setModalMode('edit');
        setIsModalOpen(true);
      }
    };

    const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedPartnerInModal(null);
    };

    const handlePartnerCreated = (newPartner) => {
      if (newPartner && newPartner.id) {
        refetch();
        onChange({ target: { name, value: newPartner.id } });
      }
      handleCloseModal();
    };

    const handlePartnerUpdated = () => {
      refetch();
      handleCloseModal();
    };

    if (isLoading) {
      return (
        <div className="partnerinput-select">
          <CustomTextField
            label={label}
            placeholder="Loading partners..."
            disabled
            fullWidth
            variant="outlined"
          />
        </div>
      );
    }

    if (isError) {
      console.error('Failed to load partners:', error);
      return (
        <div className="partnerinput-select">
          <CustomTextField
            label={label}
            placeholder="Error loading partners"
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
        <PartnerSelectAutocompleteInput
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          options={partnerOptions}
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
        <AddPartner
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          selectedPartner={selectedPartnerInModal}
          onPartnerCreated={handlePartnerCreated}
          onPartnerUpdated={handlePartnerUpdated}
        />
      </>
    );
  },
);
PartnerAutoCompleteWithAddOption.displayName = 'PartnerAutoCompleteWithAddOption';

export default PartnerAutoCompleteWithAddOption;

const PartnerSelectAutocompleteInput = forwardRef(
  (
    {
      name,
      value,
      onChange,
      options,
      label,
      placeholder = '',
      required = false,
      disabled = false,
      className = '',
      onAddNew,
      onEdit,
      is_edit,
      style = {},
      ...rest
    },
    ref,
  ) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    
    // REMOVED: dropdownRef and scrolling useEffect
    const hasBeenFocused = useRef(false);

    useEffect(() => {
      const selectedOption = options.find((opt) => opt.value === value);
      setInputValue(selectedOption ? selectedOption.label : '');
    }, [value, options]);

    const filteredOptions = useMemo(() => {
      if (!inputValue) {
        return options;
      }
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
        onChange({ target: { name, value: '' } });
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
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prevIndex) => (prevIndex + 1) % itemsCount);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(
            (prevIndex) => (prevIndex - 1 + itemsCount) % itemsCount,
          );
          break;
        case 'Enter':
          if (activeIndex < 0) return;
          e.preventDefault();
          if (activeIndex < filteredOptions.length) {
            handleSelectOption(filteredOptions[activeIndex]);
          } else if (showAddNewOption) {
            handleAddNew();
          }
          break;
        case 'Escape':
          setShowDropdown(false);
          break;
        default:
          break;
      }
    };

    return (
      <div 
        // className={`partnerinput-select ${className}`}
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
            className="partnerinput-select__dropdown"
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
                  className={`partnerinput-select__option ${
                    index === activeIndex ? 'active' : ''
                  }`}
                >
                  <div className="partnerinput-select__option-content">
                    <span>{opt.label}</span>
                    {is_edit && !disabled && (
                      <button
                        type="button"
                        className="partnerinput-select__edit-button"
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
                className={`partnerinput-select__option partnerinput-select__option--add ${
                  activeIndex === 0 ? 'active' : ''
                }`}
              >
                + Add "{inputValue}"
              </li>
            ) : null}
          </CustomScrollbar>
        )}
      </div>
    );
  },
);
PartnerSelectAutocompleteInput.displayName = 'PartnerSelectAutocompleteInput';