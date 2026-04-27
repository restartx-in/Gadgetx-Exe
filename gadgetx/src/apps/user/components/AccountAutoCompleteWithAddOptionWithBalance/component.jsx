import {
  useState,
  useEffect,
  forwardRef,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import AmountSymbol from "@/apps/user/components/AmountSymbol";
import { useAccounts } from "@/apps/user/hooks/api/account/useAccounts";
import AddAccount from "@/apps/user/pages/List/AccountList/components/AddAccount";
import CashBook from "@/apps/user/pages/Transactions/CashBook";
import { useToast } from "@/context/ToastContext";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { HiPencil } from "react-icons/hi2";

// 1. Imports
import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";

import "./style.scss";

const AccountAutoCompleteWithAddOptionWithBalance = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label = "Account",
      placeholder = "Select an Account",
      required = false,
      disabled = false,
      className = "",
      filters = {},
      debitAmount,
      is_edit = true,
      style = {},
    },
    ref
  ) => {
    const { data: accounts, isLoading, isError, error } = useAccounts(filters);
    const [accountOptions, setAccountOptions] = useState([]);
    const showToast = useToast();
    const navigate = useNavigate();

    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [selectedAccount, setSelectedAccount] = useState(null);

    const [isOpenCashBookModal, setIsOpenCashBookModal] = useState(false);
    const [selectedCashBookEntry, setSelectedCashBookEntry] = useState(null);
    const [cashBookMode, setCashBookMode] = useState("add");

    const handleDepositClick = useCallback((account) => {
      setIsAccountModalOpen(false);
      setSelectedCashBookEntry({
        account_id: account.id,
        transaction_type: "deposit",
      });
      setCashBookMode("add");
      setIsOpenCashBookModal(true);
    }, []);

    const handleWithdrawalClick = useCallback((account) => {
      setIsAccountModalOpen(false);
      setSelectedCashBookEntry({
        account_id: account.id,
        transaction_type: "withdrawal",
      });
      setCashBookMode("add");
      setIsOpenCashBookModal(true);
    }, []);

    const handleShowTransactions = useCallback(
      (account) => {
        setIsOpenCashBookModal(false);
        setIsAccountModalOpen(false);

        navigate("/cash-book-report", { state: { accountName: account.name } });
      },
      [navigate]
    );

    useEffect(() => {
      if (accounts) {
        const options = accounts.map((account) => ({
          value: account.id,
          label: account.name,
          amount: account.balance,
        }));
        setAccountOptions(options);
      }
    }, [accounts]);

    const handleAddNew = (typedValue) => {
      setSelectedAccount({ name: typedValue });
      setModalMode("add");
      setIsAccountModalOpen(true);
    };

    const handleEdit = (option) => {
      const accountToEdit = accounts.find((acc) => acc.id === option.value);
      if (accountToEdit) {
        setSelectedAccount(accountToEdit);
        setModalMode("edit");
        setIsAccountModalOpen(true);
      }
    };

    const handleCloseModal = () => {
      setIsAccountModalOpen(false);
      setSelectedAccount(null);
    };

    if (isLoading) {
      return (
        <div className="accountbalanceinput-select">
          <CustomTextField
            label={label}
            placeholder="Loading accounts..."
            disabled
            fullWidth
            variant="outlined"
          />
        </div>
      );
    }

    if (isError) {
      console.error("Failed to load accounts:", error);
      return (
        <div className="accountbalanceinput-select">
          <CustomTextField
            label={label}
            placeholder="Error loading accounts"
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
          is_edit={is_edit}
          debitAmount={debitAmount}
          showToast={showToast}
          style={style}
        />
        <AddAccount
          isOpen={isAccountModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          selectedAccount={selectedAccount}
          onDeposit={handleDepositClick}
          onWithdrawal={handleWithdrawalClick}
          onShowTransactions={handleShowTransactions}
        />
        <CashBook
          isOpen={isOpenCashBookModal}
          onClose={() => setIsOpenCashBookModal(false)}
          mode={cashBookMode}
          selectedEntry={selectedCashBookEntry}
          onSuccess={() => {}}
        />
      </>
    );
  }
);

export default AccountAutoCompleteWithAddOptionWithBalance;

const AccountSelectAutocompleteInput = forwardRef(
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
      debitAmount,
      showToast,
      style = {},
      ...rest
    },
    ref
  ) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);

    // Removed: dropdownRef and the scrolling useEffect
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
      const amountToDebit = parseFloat(debitAmount) || 0;
      const accountBalance = parseFloat(option.amount);

      if (amountToDebit > 0 && accountBalance < amountToDebit) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: `Insufficient funds in ${option.label}. Balance is ${accountBalance}.`,
          status: TOASTSTATUS.ERROR,
        });
        setShowDropdown(false);
        setInputValue("");
        onChange({ target: { name, value: "" } });

        return;
      }

      const event = {
        target: {
          name: name,
          value: option.value,
          selectedOption: option,
        },
      };
      onChange(event);
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
      e.preventDefault(); // Prevent blur
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
      if (!showDropdown) return;
      const showAddNew = showAddNewOption;
      const itemsCount = filteredOptions.length + (showAddNew ? 1 : 0);
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
          } else if (showAddNew) {
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
        className={`accountbalanceinput-select ${className}`}
        style={{ ...style, position: "relative" }}
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
            className="accountbalanceinput-select__dropdown"
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
                  className={`accountbalanceinput-select__option ${
                    index === activeIndex ? "active" : ""
                  }`}
                >
                  <div className="accountbalanceinput-select__option-content">
                    <div className="left-section">
                      <span>{opt.label}</span>
                    </div>

                    <div className="right-section">
                      <span className="fs14">
                        <AmountSymbol>
                          {parseFloat(opt.amount).toLocaleString("en-IN")}
                        </AmountSymbol>
                      </span>
                      {is_edit && (
                        <button
                          type="button"
                          className="accountbalanceinput-select__edit-button"
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
                  e.preventDefault();
                  handleAddNew();
                }}
                className={`accountbalanceinput-select__option accountbalanceinput-select__option--add ${
                  activeIndex === 0 ? "active" : ""
                }`}
              >
                + Add "{inputValue}"
              </li>
            ) : (
              <li className="accountbalanceinput-select__option accountbalanceinput-select__option--no-results">
                No accounts found
              </li>
            )}
          </CustomScrollbar>
        )}
      </div>
    );
  }
);
