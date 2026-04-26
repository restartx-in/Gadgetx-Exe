import {
  useState,
  useEffect,
  forwardRef,
  useRef,
  useMemo,
} from 'react'
// Assuming useLedgers is available similar to useAccounts
import useLedgers from '@/hooks/api/ledger/useLedger' 
import AmountSymbol from '@/components/AmountSymbol'
import CustomTextField from '@/components/CustomTextField'
import CustomScrollbar from '@/components/CustomScrollbar'
import AddLedger from '@/apps/user/pages/List/LedgerList/components/AddLedger' 
import { useToast } from '@/context/ToastContext'
import { HiPencil } from 'react-icons/hi2' 

import './style.scss' 

const LedgerAutoCompleteWithAddOptionWithBalance = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label='Ledger',
      placeholder = 'Select a Ledger',
      required = false,
      disabled = false,
      className = '',
      filters = {},
      is_edit = true,
      style = {}
    },
    ref,
  ) => {
    // 1. Data Fetching
    const { data: ledgers, isLoading, isError, error } = useLedgers(filters)
    const [ledgerOptions, setLedgerOptions] = useState([])
    const showToast = useToast()

    // 2. Modal State Management
    const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState('add')
    const [selectedLedger, setSelectedLedger] = useState(null)

    // 3. Transform Data for Autocomplete
    useEffect(() => {
      if (ledgers) {
        const options = ledgers.map((ledger) => ({
          value: ledger.id,
          label: ledger.name,
          amount: ledger.balance, 
        }))
        setLedgerOptions(options)
      }
    }, [ledgers])

    // 4. Handlers for Add/Edit Flow
    const handleAddNew = (typedValue) => {
      setSelectedLedger({ name: typedValue })
      setModalMode('add')
      setIsLedgerModalOpen(true)
    }

    const handleEdit = (option) => {
      const ledgerToEdit = ledgers.find((ldg) => ldg.id === option.value)
      if (ledgerToEdit) {
        setSelectedLedger(ledgerToEdit)
        setModalMode('edit')
        setIsLedgerModalOpen(true)
      }
    }

    const handleCloseModal = () => {
      setIsLedgerModalOpen(false)
      setSelectedLedger(null)
    }

    // 5. Loading/Error States
    if (isLoading) {
      return (
        <div className="ledger-balance-autocomplete"> 
          <CustomTextField
            label={label}
            placeholder="Loading ledgers..."
            disabled
            fullWidth
            variant="outlined"
          />
        </div>
      )
    }

    if (isError) {
      console.error('Failed to load ledgers:', error)
      return (
        <div className="ledger-balance-autocomplete"> 
          <CustomTextField
            label={label}
            placeholder="Error loading ledgers"
            disabled
            error
            fullWidth
            variant="outlined"
          />
        </div>
      )
    }

    // 6. Render Autocomplete Input and Modal
    return (
      <>
        <LedgerSelectAutocompleteInput
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          options={ledgerOptions}
          label={label}
          placeholder={placeholder}
          required={required}
          disabled={disabled || isLoading}
          className={className}
          onAddNew={handleAddNew}
          onEdit={handleEdit}
          is_edit={is_edit}
          style={style}
        />
        <AddLedger
          isOpen={isLedgerModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          selectedLedger={selectedLedger}
          // The onLedgerCreated prop can be used to update the list or re-select
          onLedgerCreated={(newLedger) => { 
            onChange({ target: { name, value: newLedger.id } })
          }}
        />
      </>
    )
  },
)

export default LedgerAutoCompleteWithAddOptionWithBalance

// ----------------------------------------------------------------------
// UI Component: LedgerSelectAutocompleteInput
// ----------------------------------------------------------------------

const LedgerSelectAutocompleteInput = forwardRef(
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
    const hasBeenFocused = useRef(false)

    useEffect(() => {
      const selectedOption = options.find((opt) => opt.value === value)
      setInputValue(selectedOption ? selectedOption.label : '')
    }, [value, options])

    const filteredOptions = useMemo(() => {
      if (!inputValue) {
        return options
      }
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
      // Logic for Insufficient funds check removed (as per Ledger requirement)
      const event = {
        target: {
          name: name,
          value: option.value,
          selectedOption: option,
        },
      }
      onChange(event)
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

    const handleFocus = () => {
      if (hasBeenFocused.current) {
        setShowDropdown(true)
      }
      hasBeenFocused.current = true
    }

    const handleKeyDown = (e) => {
      if (!showDropdown) return
      const showAddNew = showAddNewOption
      const itemsCount = filteredOptions.length + (showAddNew ? 1 : 0)
      if (itemsCount === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prevIndex) => (prevIndex + 1) % itemsCount)
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex(
            (prevIndex) => (prevIndex - 1 + itemsCount) % itemsCount,
          )
          break
        case 'Enter':
          if (activeIndex < 0) return
          e.preventDefault()
          if (activeIndex < filteredOptions.length) {
            handleSelectOption(filteredOptions[activeIndex])
          } else if (showAddNew) {
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
        className={`ledger-balance-autocomplete ${className}`} 
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
            setShowDropdown(true)
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
            className="ledger-balance-autocomplete__dropdown" 
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
                  className={`ledger-balance-autocomplete__option ${ 
                    index === activeIndex ? 'active' : ''
                  }`}
                >
                  <div className="ledger-balance-autocomplete__option-content"> 
                    <div className="left-section">
                      <span>{opt.label}</span>
                    </div>

                    <div className="right-section">
                      <span className="fs14">
                        <AmountSymbol>
                          {parseFloat(opt.amount).toLocaleString('en-IN')}
                        </AmountSymbol>
                      </span>
                      {is_edit && (
                        <button
                          type="button"
                          className="ledger-balance-autocomplete__edit-button" 
                          onMouseDown={(e) => handleEditClick(e, opt)}
                        >
                          <HiPencil size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))
            ) : showAddNewOption ? (
              <li
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleAddNew()
                }}
                className={`ledger-balance-autocomplete__option ledger-balance-autocomplete__option--add ${ 
                  activeIndex === 0 ? 'active' : ''
                }`}
              >
                + Add "{inputValue}"
              </li>
            ) : (
              <li className="ledger-balance-autocomplete__option ledger-balance-autocomplete__option--no-results"> 
                No ledgers found
              </li>
            )}
          </CustomScrollbar>
        )}
      </div>
    )
  },
)