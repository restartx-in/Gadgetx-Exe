import { useState, useEffect, forwardRef, useRef, useMemo } from 'react';
import { useRoles } from '@/hooks/api/role/useRoles';
import AddRole from '@/apps/user/pages/List/RoleList/components/AddRole';
import { HiPencil } from 'react-icons/hi2';

// 1. Import Custom Components
import CustomTextField from '@/components/CustomTextField';
import CustomScrollbar from '@/components/CustomScrollbar';

import './style.scss'; 

const RoleAutoCompleteWithAddOption = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label = 'Role',
      placeholder = 'Select a Role',
      required = false,
      disabled = false,
      className = '',
      filters = {},
      is_edit = true,
      style = {},
    },
    ref,
  ) => {
    const { data: roles, isLoading, isError, error, refetch } = useRoles(filters);
    const [roleOptions, setRoleOptions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedRoleInModal, setSelectedRoleInModal] = useState(null);

    useEffect(() => {
      if (roles) {
        const options = roles.map((role) => ({
          value: role.id,
          label: role.name,
        }));
        setRoleOptions(options);
      }
    }, [roles]);

    const handleAddNew = (typedValue) => {
      setSelectedRoleInModal({ name: typedValue });
      setModalMode('add');
      setIsModalOpen(true);
    };

    const handleEdit = (option) => {
      const roleToEdit = roles.find((r) => r.id === option.value);
      if (roleToEdit) {
        setSelectedRoleInModal(roleToEdit);
        setModalMode('edit');
        setIsModalOpen(true);
      }
    };

    const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedRoleInModal(null);
    };

    const onRoleCreated = (newRole) => {
      if (newRole && newRole.id) {
        refetch();
        onChange({ target: { name, value: newRole.id } });
        handleCloseModal();
      }
    };

    const onRoleUpdated = () => {
      refetch();
      handleCloseModal();
    };

    if (isLoading) {
      return (
        <div className="roleinput-select">
          <CustomTextField
            label={label}
            placeholder="Loading roles..."
            disabled
            fullWidth
            variant="outlined"
          />
        </div>
      );
    }

    if (isError) {
      console.error('Failed to load roles:', error);
      return (
        <div className="roleinput-select">
          <CustomTextField
            label={label}
            placeholder="Error loading roles"
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
        <RoleSelectAutocompleteInput
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          options={roleOptions}
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
        <AddRole
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          selectedRole={selectedRoleInModal}
          onSuccess={modalMode === 'add' ? onRoleCreated : onRoleUpdated}
        />
      </>
    );
  },
);

export default RoleAutoCompleteWithAddOption;

const RoleSelectAutocompleteInput = forwardRef(
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
      
      const showAddNew = onAddNew && inputValue && !filteredOptions.some(opt => opt.label.toLowerCase() === inputValue.toLowerCase());
      const itemsCount = filteredOptions.length + (showAddNew ? 1 : 0);

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
          } else if (showAddNew) {
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
        // className={`roleinput-select ${className}`}
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
            className="roleinput-select__dropdown"
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
                className={`roleinput-select__option ${index === activeIndex ? 'active' : ''}`}
              >
                <div className="roleinput-select__option-content">
                  <span>{opt.label}</span>
                  {is_edit && !disabled && (
                    <button
                      type="button"
                      className="roleinput-select__edit-button"
                      onMouseDown={(e) => handleEditClick(e, opt)}
                    >
                      <HiPencil size={15} />
                    </button>
                  )}
                </div>
              </li>
            ))
            ) : null}
            
            {onAddNew && inputValue && !filteredOptions.some(opt => opt.label.toLowerCase() === inputValue.toLowerCase()) && (
              <li
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleAddNew();
                }}
                className={`roleinput-select__option roleinput-select__option--add ${activeIndex === filteredOptions.length ? 'active' : ''}`}
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