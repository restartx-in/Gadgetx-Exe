import React, { useState, useEffect, useRef } from "react";
import { FaPlus, FaChevronDown } from "react-icons/fa";
import "./style.scss";

const VoucherAddButton = ({ title = "Add New", items = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="voucher_add_dropdown" ref={dropdownRef}>
      <button
        className="add_button medium primary"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <div className="add_button-icon">
          <FaPlus className="add_button-icon-svg" />
        </div>
        <span className="add_button-text">{title}</span>
      </button>

      {isOpen && (
        <div className="dropdown_menu">
          {items.map((item, index) => (
            <button
              key={index}
              className="dropdown_item"
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
            >
              <FaPlus className="add_button-icon-svg" />

              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VoucherAddButton;
