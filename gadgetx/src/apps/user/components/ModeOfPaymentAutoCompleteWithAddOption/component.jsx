import {
  useState,
  useEffect,
  forwardRef,
  useRef,
  useMemo,
} from 'react'
import { HiPencil } from 'react-icons/hi2'
import { useModeOfPayments } from '@/hooks/api/modeOfPayment/useModeOfPayments'
import AddModeOfPayment from '@/apps/user/pages/List/ModeOfPaymentList/components/AddModeOfPayment'

import CustomTextField from '@/components/CustomTextField'
import CustomScrollbar from '@/components/CustomScrollbar'

import './style.scss'

const ModeOfPaymentAutoCompleteWithAddOption = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label='Mode of Payment',
      placeholder = 'Select Mode',
      required = false,
      disabled = false,
      className = '',
      is_edit = true,
      style = {}
    },
    ref,
  ) => {
    // 1. Fetch MOPs
    const { data: mops, isLoading, isError } = useModeOfPayments()
    const [options, setOptions] = useState([])

    // 2. Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState('add')
    const [selectedMOP, setSelectedMOP] = useState(null)

    // 3. Sync data to options
    useEffect(() => {
      if (mops) {
        const mappedOptions = mops.map((mop) => ({
          value: mop.id,
          label: mop.name,
          original: mop,
        }))
        setOptions(mappedOptions)
      }
    }, [mops])

    // 4. Handlers
    const handleAddNew = (typedValue) => {
      setSelectedMOP({ name: typedValue })
      setModalMode('add')
      setIsModalOpen(true)
    }

    const handleEdit = (option) => {
      setSelectedMOP(option.original)
      setModalMode('edit')
      setIsModalOpen(true)
    }

    const handleCloseModal = () => {
      setIsModalOpen(false)
      setSelectedMOP(null)
    }

    // Callback when a new MOP is created successfully
    const handleMOPCreated = (newMOP) => {
      onChange({
        target: {
          name,
          value: newMOP.id,
        },
      })
      
    }

    if (isLoading) {
      return (
        <div className="mop-autocomplete-select">
          <CustomTextField
            label={label}
            placeholder="Loading..."
            disabled
            fullWidth
            variant="outlined"
          />
        </div>
      )
    }

    if (isError) {
      return (
        <div className="mop-autocomplete-select">
           <CustomTextField
            label={label}
            placeholder="Error loading data"
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
        <MOPSelectAutocompleteInput
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          options={options}
          label={label}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={className}
          onAddNew={handleAddNew}
          onEdit={handleEdit}
          is_edit={is_edit}
          style={style}
        />
        <AddModeOfPayment
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          selectedMOP={selectedMOP}
          onMOPCreated={handleMOPCreated}
        />
      </>
    )
  },
)

export default ModeOfPaymentAutoCompleteWithAddOption

// Internal Input Component
const MOPSelectAutocompleteInput = forwardRef(
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
    const [showDropdown, setShowDropdown] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [activeIndex, setActiveIndex] = useState(-1)
    
    // Removed: dropdownRef and scrolling useEffect (handled by CustomScrollbar)
    const hasBeenFocused = useRef(false)

    // Sync input text with selected value
    useEffect(() => {
      const selectedOption = options.find((opt) => opt.value == value)
      setInputValue(selectedOption ? selectedOption.label : '')
    }, [value, options])

    const filteredOptions = useMemo(() => {
      if (!inputValue) return options
      return options.filter((opt) =>
        opt.label.toLowerCase().includes(inputValue.toLowerCase()),
      )
    }, [inputValue, options])

    const exactMatchExists = useMemo(
      () =>
        options.some(
          (opt) => opt.label.toLowerCase() === inputValue.toLowerCase().trim(),
        ),
      [inputValue, options],
    )

    const showAddNewOption = inputValue && !exactMatchExists && onAddNew

    const handleInputChange = (e) => {
      const currentInput = e.target.value
      setInputValue(currentInput)
      setActiveIndex(-1)
      setShowDropdown(true)

      if (currentInput.length === 0) {
        onChange({ target: { name, value: '' } })
      }
    }

    const handleSelectOption = (option) => {
      onChange({ target: { name, value: option.value } })
      setInputValue(option.label)
      setShowDropdown(false)
    }

    const handleAddNew = () => {
      if (onAddNew) onAddNew(inputValue)
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

    const handleFocus = () => {
      setShowDropdown(true)
    }

    const handleKeyDown = (e) => {
      if (!showDropdown) return
      const itemsCount = filteredOptions.length + (showAddNewOption ? 1 : 0)
      if (itemsCount === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prev) => (prev + 1) % itemsCount)
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((prev) => (prev - 1 + itemsCount) % itemsCount)
          break
        case 'Enter':
          e.preventDefault()
          if (activeIndex < 0) return
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
        // className={`mop-autocomplete-select ${className}`}
        style={{ ...style, position: 'relative' }}
      >
        <CustomTextField
          ref={ref}
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
            className="mop-autocomplete-select__dropdown"
            activeIndex={activeIndex}
            as="ul"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => (
                <li
                  key={opt.value}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelectOption(opt)
                  }}
                  className={`mop-autocomplete-select__option ${
                    index === activeIndex ? 'active' : ''
                  }`}
                >
                  <div className="mop-autocomplete-select__option-content">
                    <span>{opt.label}</span>
                    {is_edit && (
                      <button
                        type="button"
                        className="mop-autocomplete-select__edit-button"
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
                  e.preventDefault()
                  handleAddNew()
                }}
                className={`mop-autocomplete-select__option mop-autocomplete-select__option--add ${
                  activeIndex === 0 ? 'active' : ''
                }`}
              >
                + Add "{inputValue}"
              </li>
            ) : (
              <li className="mop-autocomplete-select__option mop-autocomplete-select__option--no-results">
                No results found
              </li>
            )}
          </CustomScrollbar>
        )}
      </div>
    )
  },
)