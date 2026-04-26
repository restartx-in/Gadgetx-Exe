import React, { useState, useRef, useEffect } from "react";
import { TfiExport } from "react-icons/tfi";
import { SlPrinter } from "react-icons/sl";
const ExportMenu = ({ onExcel, onPdf, onPrint }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const buttonStyle = {
    height: "36px",
    padding: "0 11px",
    borderRadius: "4px",
    border: "1px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#333",
  };

  const dropdownItemStyle = {
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#333",
    transition: "background 0.2s",
  };

  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      
      {/* Print Button */}
      <button
        className="btn-outline-secondary"
        onClick={onPrint}
        style={buttonStyle}
        title="Print Report"
      >
        <SlPrinter  size={16} />
      </button>

      {/* Export Dropdown */}
      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          className="btn-outline-secondary"
          onClick={() => setIsOpen(!isOpen)}
          style={buttonStyle}
        >
           <TfiExport  size={16} />
        </button>

        {isOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "4px",
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "4px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              zIndex: 50,
              minWidth: "120px",
            }}
          >
            <div
              onClick={() => {
                onExcel();
                setIsOpen(false);
              }}
              style={{
                ...dropdownItemStyle,
                borderBottom: "1px solid #f0f0f0",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#f7fafc")}
              onMouseLeave={(e) => (e.target.style.background = "white")}
            >
              Excel
            </div>

            <div
              onClick={() => {
                onPdf();
                setIsOpen(false);
              }}
              style={dropdownItemStyle}
              onMouseEnter={(e) => (e.target.style.background = "#f7fafc")}
              onMouseLeave={(e) => (e.target.style.background = "white")}
            >
              PDF
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportMenu;
