import {
  useState,
  useEffect,
  forwardRef,
  useRef,
  useMemo,
  useCallback,
  lazy,      
  Suspense,   
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccounts } from '@/hooks/api/account/useAccounts'
import { HiPencil } from 'react-icons/hi2'

import CustomTextField from '@/components/CustomTextField'
import CustomScrollbar from '@/components/CustomScrollbar'

import './style.scss'

// 3. Lazy load the components to break Circular Dependency
const AddAccount = lazy(() => import('@/apps/user/pages/List/AccountList/components/AddAccount'))
const CashBook = lazy(() => import('@/apps/user/pages/Transactions/CashBook'))

const AccountAutoCompleteWithAddOption = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label = 'Account',
      placeholder = 'Select an Account',
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
      data: accounts,
      isLoading,
      isError,
      error,
      refetch,
    } = useAccounts(filters)
    const [accountOptions, setAccountOptions] = useState([])
    const navigate = useNavigate()

    // Account Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState('add')
    const [selectedAccountInModal, setSelectedAccountInModal] = useState(null)

    // CashBook Modal State
    const [isOpenCashBookModal, setIsOpenCashBookModal] = useState(false)
    const [selectedCashBookEntry, setSelectedCashBookEntry] = useState(null)
    const [cashBookMode, setCashBookMode] = useState('add')

    const handleDepositClick = useCallback((account) => {
      setIsModalOpen(false)
      setSelectedCashBookEntry({
        account_id: account.id,
        transaction_type: 'deposit',
      })
      setCashBookMode('add')
      setIsOpenCashBookModal(true)
    }, [])

    const handleWithdrawalClick = useCallback((account) => {
      setIsModalOpen(false)
      setSelectedCashBookEntry({
        account_id: account.id,
        transaction_type: 'withdrawal',
      })
      setCashBookMode('add')
      setIsOpenCashBookModal(true)
    }, [])

    const handleShowTransactions = useCallback(
      (account) => {
        setIsOpenCashBookModal(false)
        setIsModalOpen(false)
        navigate('/cash-book-report', { state: { accountName: account.name } })
      },
      [navigate],
    )

    useEffect(() => {
      if (accounts) {
        const options = accounts.map((account) => ({
          value: account.id,
          label: account.name,
        }))
        setAccountOptions(options)
      }
    }, [accounts])

    const handleAddNew = (typedValue) => {
      setSelectedAccountInModal({ name: typedValue })
      setModalMode('add')
      setIsModalOpen(true)
    }

    const handleEdit = (option) => {
      const accountToEdit = accounts.find(
        (account) => account.id === option.value,
      )
      if (accountToEdit) {
        setSelectedAccountInModal(accountToEdit)
        setModalMode('edit')
        setIsModalOpen(true)
      }
    }

    const handleCloseModal = () => {
      setIsModalOpen(false)
      setSelectedAccountInModal(null)
    }

    const onAccountCreated = (newAccount) => {
      if (newAccount && newAccount.id) {
        refetch()
        onChange({ target: { name, value: newAccount.id } })
        handleCloseModal()
      }
    }

    const onAccountUpdated = () => {
      refetch()
      handleCloseModal()
    }

    if (isLoading) {
      return (
        <div className="accountinput-select">
          <CustomTextField
            label={label}
            placeholder="Loading accounts..."
            disabled
            fullWidth
            variant="outlined"
          />
        </div>
      )
    }

    if (isError) {
      console.error('Failed to load accounts:', error)
      return (
        <div className="accountinput-select">
          <CustomTextField
            label={label}
            placeholder="Error loading accounts"
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
        <AccountSelectAutocompleteInput
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          options={accountOptions}
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
        
        {/* 4. Wrap lazy components in Suspense */}
        <Suspense fallback={null}>
          {(isModalOpen || isOpenCashBookModal) && (
            <>
              {isModalOpen && (
                <AddAccount
                  isOpen={isModalOpen}
                  onClose={handleCloseModal}
                  mode={modalMode}
                  selectedAccount={selectedAccountInModal}
                  onAccountCreated={onAccountCreated}
                  onAccountUpdated={onAccountUpdated}
                  onDeposit={handleDepositClick}
                  onWithdrawal={handleWithdrawalClick}
                  onShowTransactions={handleShowTransactions}
                />
              )}
              
              {isOpenCashBookModal && (
                <CashBook
                  isOpen={isOpenCashBookModal}
                  onClose={() => setIsOpenCashBookModal(false)}
                  mode={cashBookMode}
                  selectedEntry={selectedCashBookEntry}
                  onSuccess={() => {
                     refetch();
                  }}
                />
              )}
            </>
          )}
        </Suspense>
      </>
    )
  },
)

export default AccountAutoCompleteWithAddOption

const AccountSelectAutocompleteInput = forwardRef(
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

    const handleFocus = () => {
      if (hasBeenFocused.current) {
        setShowDropdown(true)
      }
      hasBeenFocused.current = true
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
            (prevIndex) => (prevIndex - 1 + itemsCount) % itemsCount,
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
            className="accountautoinputs-select__dropdown"
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
                  className={`accountautoinputs-select__option ${
                    index === activeIndex ? 'active' : ''
                  }`}
                >
                  <div className="accountautoinputs-select__option-content">
                    <span>{opt.label}</span>
                    {is_edit && !disabled && (
                      <button
                        type="button"
                        className="accountautoinputs-select__edit-button"
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
                className={`accountautoinputs-select__option accountautoinputs-select__option--add ${
                  activeIndex === 0 ? 'active' : ''
                }`}
              >
                + Add "{inputValue}"
              </li>
            ) : null}
          </CustomScrollbar>
        )}
      </div>
    )
  },
)