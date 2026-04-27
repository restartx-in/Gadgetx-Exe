import { useState, useEffect, forwardRef, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAccounts } from "@/apps/user/hooks/api/account/useAccounts";
import AddAccount from "@/apps/user/pages/List/AccountList/components/AddAccount";
import CashBook from "@/apps/user/pages/Transactions/CashBook";
import CustomTextField from "@/components/CustomTextField";
import CustomScrollbar from "@/components/CustomScrollbar";
import "./style.scss";

const AccountAutoComplete = forwardRef(
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
      style = {},
    },
    ref
  ) => {
    const { data: accounts, isLoading, isError, error } = useAccounts(filters);
    const [accountOptions, setAccountOptions] = useState([]);
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
        navigate("/cash-book-report", { state: { accountName: account.name } });
      },
      [navigate]
    );

    useEffect(() => {
      if (accounts) {
        const options = accounts.map((account) => ({
          value: account.id,
          label: account.name,
        }));
        setAccountOptions(options);
      }
    }, [accounts]);

    const handleCloseModal = () => {
      setIsAccountModalOpen(false);
      setSelectedAccount(null);
    };

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
      );
    }

    if (isError) {
      console.error("Failed to load accounts:", error);
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

export default AccountAutoComplete;

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
      style = {},
      ...rest
    },
    ref
  ) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);

    const hasBeenFocused = useRef(false);

    useEffect(() => {
      const selectedOption = options.find((opt) => opt.value === value);
      setInputValue(selectedOption ? selectedOption.label : "");
    }, [value, options]);

    const handleInputChange = (e) => {
      const currentInput = e.target.value;
      setInputValue(currentInput);
      setActiveIndex(-1);
      setShowDropdown(true);

      if (currentInput.length === 0) {
        setFilteredOptions(options);
        onChange({ target: { name, value: "" } });
      } else {
        const matches = options.filter((opt) =>
          opt.label.toLowerCase().includes(currentInput.toLowerCase())
        );
        setFilteredOptions(matches);
      }
    };

    const handleSelectOption = (option) => {
      onChange({ target: { name, value: option.value } });
      setInputValue(option.label);
      setShowDropdown(false);
    };

    const handleFocus = () => {
      if (hasBeenFocused.current) {
        setFilteredOptions(options);
        setShowDropdown(true);
      }
      hasBeenFocused.current = true;
    };

    const handleInputClick = () => {
      setFilteredOptions(options);
      setShowDropdown(true);
    };

    const handleKeyDown = (e) => {
      if (!showDropdown) return;

      const itemsCount = filteredOptions.length;
      if (itemsCount === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prevIndex) =>
            prevIndex < itemsCount - 1 ? prevIndex + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prevIndex) =>
            prevIndex > 0 ? prevIndex - 1 : itemsCount - 1
          );
          break;
        case "Enter":
          if (activeIndex < 0) return;
          e.preventDefault();
          if (activeIndex < filteredOptions.length) {
            handleSelectOption(filteredOptions[activeIndex]);
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
      <div style={{ ...style, position: "relative" }} className={className}>
        <CustomTextField
          ref={ref}
          id={name}
          name={name}
          label={label}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onClick={handleInputClick}
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
            className="accountinput-select__dropdown"
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
                  className={`accountinput-select__option ${
                    index === activeIndex ? "active" : ""
                  }`}
                >
                  <div className="accountinput-select__option-content">
                    <span>{opt.label}</span>
                  </div>
                </li>
              ))
            ) : (
              <li
                className="accountinput-select__option"
                style={{ cursor: "default", color: "#94a3b8" }}
              >
                No accounts found
              </li>
            )}
          </CustomScrollbar>
        )}
      </div>
    );
  }
);
