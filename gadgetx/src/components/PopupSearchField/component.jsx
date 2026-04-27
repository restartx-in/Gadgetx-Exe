import React, { useState, useRef, useEffect } from "react";
import { IoSearch } from "react-icons/io5";

import "./style.scss";

const CustomSelect = ({ value, onChange, options, className }) => (
  <select value={value} onChange={onChange} className={className}>
    {options.map((option, index) => (
      <option key={index} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

const PopupSearchField = ({
  searchRef,
  searchOptions,
  handleSearch,
  searchKey,
  setSearchType,
  setSearchKey,
  searchType,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const buttonRef = useRef(null);
  const popupRef = useRef(null);
  const focusInputRef = useRef(null);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSearchAndClose = () => {
    handleSearch();
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        popupRef.current &&
        !popupRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && focusInputRef.current) {
      focusInputRef.current.focus();
    }
  }, [isOpen]);

  const selectOptions = [
    { value: "", label: "Search Type" },
    ...(searchOptions || []).map((option) => ({
      value: option.value,
      label: option.name,
    })),
  ];

  const currentTypeName =
    searchOptions?.find((option) => option.value === searchType)?.name ||
    "Search";
  const buttonText = `${currentTypeName}`;

  return (
    <div className="popup_search_container">
      <button
        ref={buttonRef}
        className="popup_search_button fw500"
        onClick={handleToggle}
        aria-expanded={isOpen}
      >
        <IoSearch size={18} />
        {/* <span>{buttonText}</span> */}
      </button>

      {isOpen && (
        <div
          className="popup_search_dropdown p16"
          ref={popupRef}
          role="dialog"
          aria-modal="true"
        >
          <CustomSelect
            value={searchType}
            onChange={(e) => {
              setSearchType(e.target.value);
              focusInputRef.current?.focus();
            }}
            className="fs14 popup_search_content__select"
            options={selectOptions}
          />

          <div className="popup_search_content__input_wrapper">
            <input
              type="text"
              ref={focusInputRef}
              className="fs14"
              placeholder={currentTypeName}
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchAndClose();
              }}
            />
            <button onClick={handleSearchAndClose}>
              <IoSearch />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PopupSearchField;
