import { useState, useEffect, forwardRef, useRef, useMemo } from 'react'
import { useEmployeePosition } from '@/hooks/api/employeePosition/useEmployeePosition'
import AddEmployeePosition from '@/apps/user/pages/List/EmployeePositionList/components/AddEmployeePosition' 
import { HiPencil } from 'react-icons/hi2'

import CustomTextField from '@/components/CustomTextField'
import CustomScrollbar from '@/components/CustomScrollbar'

import './style.scss'

const EmployeePositionAutoCompleteWithAddOption = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label='Employee Position',
      placeholder = 'Select an Employee Position',
      required = false,
      disabled = false,
      className = '',
      filters = {},
      is_edit = true,
      style = {}
    },
    ref
  ) => {
    const {
      data: employeePositions,
      isLoading,
      isError,
      error,
      refetch,
    } = useEmployeePosition(filters)
    const [employeePositionOptions, setEmployeePositionOptions] = useState([])

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState('add')
    const [
      selectedEmployeePositionInModal,
      setSelectedEmployeePositionInModal,
    ] = useState(null)

    useEffect(() => {
      if (employeePositions) {
        const options = employeePositions.map((position) => ({
          value: position.id,
          label: position.name,
        }))
        setEmployeePositionOptions(options)
      }
    }, [employeePositions])

    const handleAddNew = (typedValue) => {
      setSelectedEmployeePositionInModal({ name: typedValue })
      setModalMode('add')
      setIsModalOpen(true)
    }

    const handleEdit = (option) => {
      const positionToEdit = employeePositions.find(
        (position) => position.id === option.value
      )
      if (positionToEdit) {
        setSelectedEmployeePositionInModal(positionToEdit)
        setModalMode('edit')
        setIsModalOpen(true)
      }
    }

    const handleCloseModal = () => {
      setIsModalOpen(false)
      setSelectedEmployeePositionInModal(null)
    }

    const onEmployeePositionCreated = (newPosition) => {
      if (newPosition && newPosition.id) {
        refetch()
        onChange({ target: { name, value: newPosition.id } })
        handleCloseModal()
      }
    }

    const onEmployeePositionUpdated = () => {
      refetch()
      handleCloseModal()
    }

    if (isLoading) {
      return (
        <div className="employeepositioninput-select">
          <CustomTextField
            label={label}
            placeholder="Loading positions..."
            disabled
            fullWidth
            variant="outlined"
          />
        </div>
      )
    }

    if (isError) {
      console.error('Failed to load employee positions:', error)
      return (
        <div className="employeepositioninput-select">
          <CustomTextField
            label={label}
            placeholder="Error loading positions"
            disabled
            error
            fullWidth
            variant="outlined"
          />
        </div>
      )
    }

    return (
      <>
        <EmployeePositionSelectAutocompleteInput
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          options={employeePositionOptions}
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
        <AddEmployeePosition
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          selectedEmployeePosition={selectedEmployeePositionInModal}
          onEmployeePositionCreated={onEmployeePositionCreated}
          onEmployeePositionUpdated={onEmployeePositionUpdated}
        />
      </>
    )
  }
)

export default EmployeePositionAutoCompleteWithAddOption

const EmployeePositionSelectAutocompleteInput = forwardRef(
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
    ref
  ) => {
    const [showDropdown, setShowDropdown] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [activeIndex, setActiveIndex] = useState(-1)
    
    // REMOVED: dropdownRef and scrolling useEffect
    // Logic is now handled by CustomScrollbar

    useEffect(() => {
      const selectedOption = options.find((opt) => opt.value === value)
      setInputValue(selectedOption ? selectedOption.label : '')
    }, [value, options])

    const filteredOptions = useMemo(() => {
        if (!inputValue) {
          return options
        } else {
          return options.filter((opt) =>
            opt.label.toLowerCase().includes(inputValue.toLowerCase())
          )
        }
    }, [inputValue, options])

    const exactMatchExists = useMemo(
      () =>
        options.some(
          (opt) => opt.label.toLowerCase() === inputValue.toLowerCase().trim()
        ),
      [inputValue, options]
    )

    const showAddNewOption =
      inputValue && !exactMatchExists && onAddNew;

    const handleInputChange = (e) => {
      const currentInput = e.target.value
      setInputValue(currentInput)
      setActiveIndex(-1)
      setShowDropdown(true)
      if (!currentInput) {
        onChange({ target: { name, value: '' } })
      }
    }

    const handleSelectOption = (option) => {
      onChange({ target: { name, value: option.value } })
      setInputValue(option.label)
      setShowDropdown(false)
    }

    const handleAddNew = () => {
      if (onAddNew) {
        onAddNew(inputValue)
      }
      setShowDropdown(false)
    }

    const handleEditClick = (e, option) => {
      e.preventDefault()
      e.stopPropagation()
      if (onEdit) {
        onEdit(option)
        setShowDropdown(false)
      }
    }

    const handleKeyDown = (e) => {
      if (disabled || !showDropdown) return

      const itemsCount = filteredOptions.length + (showAddNewOption ? 1 : 0)
      if (itemsCount === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prevIndex) => (prevIndex + 1) % itemsCount)
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex(
            (prevIndex) => (prevIndex - 1 + itemsCount) % itemsCount
          )
          break
        case 'Enter':
          if (activeIndex < 0) return
          e.preventDefault()
          if (activeIndex < filteredOptions.length) {
            handleSelectOption(filteredOptions[activeIndex])
          } else if (showAddNewOption) {
            handleAddNew()
          }
          break
        case 'Escape':
          setShowDropdown(false)
          break
        default:
          break
      }
    }

    return (
      <div 
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
          onFocus={() => setShowDropdown(true)}
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
            className="employeepositioninput-select__dropdown"
            activeIndex={activeIndex}
            as="ul"
          >
            {filteredOptions.length > 0
              ? filteredOptions.map((opt, index) => (
                  <li
                    key={opt.value}
                    onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelectOption(opt)
                    }}
                    className={`employeepositioninput-select__option ${
                      index === activeIndex ? 'active' : ''
                    }`}>
                    <div className="employeepositioninput-select__option-content">
                      <span>{opt.label}</span>
                      {is_edit && !disabled && (
                        <button
                          type="button"
                          className="employeepositioninput-select__edit-button"
                          onMouseDown={(e) => handleEditClick(e, opt)}>
                          <HiPencil size={15} />
                        </button>
                      )}
                    </div>
                  </li>
                ))
              : showAddNewOption && (
                  <li
                    onMouseDown={(e) => {
                        e.preventDefault()
                        handleAddNew()
                    }}
                    className={`employeepositioninput-select__option employeepositioninput-select__option--add ${
                      activeIndex === 0 ? 'active' : ''
                    }`}>
                    + Add "{inputValue}"
                  </li>
                )}
          </CustomScrollbar>
        )}
      </div>
    )
  }
)