import { useState, useEffect, forwardRef, useRef, useMemo } from 'react';
import { HiPencil } from 'react-icons/hi2';
import { useCategorys } from '@/hooks/api/category/useCategorys';
import AddCategory from '@/apps/user/pages/List/CategoryList/components/AddCategory';

// 1. Import Custom Components
import CustomTextField from '@/components/CustomTextField';
import CustomScrollbar from '@/components/CustomScrollbar';

import './style.scss';

const CategoryAutoCompleteWithAddOption = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label='Category',
      placeholder = 'Select or add a category',
      required = false,
      disabled = false,
      className = '',
      filters = {},
      is_edit = true,
      style = {},
    },
    ref,
  ) => {
    const {
      data: categories,
      isLoading,
      isError,
      error,
      refetch,
    } = useCategorys(filters);

    const [categoryOptions, setCategoryOptions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedCategoryInModal, setSelectedCategoryInModal] = useState(null);

    useEffect(() => {
      if (categories) {
        const options = categories.map((category) => ({
          value: category.id,
          label: category.name,
        }));
        setCategoryOptions(options);
      }
    }, [categories]);

    const handleAddNew = (typedValue) => {
      setSelectedCategoryInModal({ name: typedValue });
      setModalMode('add');
      setIsModalOpen(true);
    };

    const handleEdit = (option) => {
      const categoryToEdit = categories.find((category) => category.id === option.value);
      if (categoryToEdit) {
        setSelectedCategoryInModal(categoryToEdit);
        setModalMode('edit');
        setIsModalOpen(true);
      }
    };

    const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedCategoryInModal(null);
    };

    const handleCategoryCreated = (newCategory) => {
      if (newCategory && newCategory.id) {
        refetch();
        onChange({ target: { name, value: newCategory.id } });
        handleCloseModal();
      } else {
        handleCloseModal();
      }
    };

    const handleCategoryUpdated = () => {
      refetch();
      handleCloseModal();
    };

    if (isLoading) {
      return (
        <div className="categoryinput-select">
          <CustomTextField
            label={label}
            placeholder="Loading categories..."
            disabled
            fullWidth
            variant="outlined"
          />
        </div>
      );
    }

    if (isError) {
      console.error('Failed to load categories:', error);
      return (
        <div className="categoryinput-select">
          <CustomTextField
            label={label}
            placeholder="Error loading categories"
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
        <CategorySelectAutocompleteInput
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          options={categoryOptions}
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
        <AddCategory
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          selectedCategory={selectedCategoryInModal}
          onCategoryCreated={handleCategoryCreated}
          onCategoryUpdated={handleCategoryUpdated}
        />
      </>
    );
  },
);

CategoryAutoCompleteWithAddOption.displayName = 'CategoryAutoCompleteWithAddOption';

export default CategoryAutoCompleteWithAddOption;

const CategorySelectAutocompleteInput = forwardRef(
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
    
    // Removed: dropdownRef and scrolling useEffect
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
      if (onAddNew) onAddNew(inputValue);
      setShowDropdown(false);
    };

    const handleEditClick = (e, option) => {
      e.preventDefault();
      e.stopPropagation();
      if (onEdit) onEdit(option);
      setShowDropdown(false);
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
          setActiveIndex((prevIndex) => (prevIndex - 1 + itemsCount) % itemsCount);
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
        // className={`categoryinput-select ${className}`}
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
            className="categoryinput-select__dropdown"
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
                  className={`categoryinput-select__option ${index === activeIndex ? 'active' : ''}`}
                >
                  <div className="categoryinput-select__option-content">
                    <span>{opt.label}</span>
                    {is_edit && !disabled && (
                      <button
                        type="button"
                        className="categoryinput-select__edit-button"
                        onMouseDown={(e) => handleEditClick(e, opt)}
                      >
                        <HiPencil size={15}/>
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
                className={`categoryinput-select__option categoryinput-select__option--add ${
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

CategorySelectAutocompleteInput.displayName = 'CategorySelectAutocompleteInput';