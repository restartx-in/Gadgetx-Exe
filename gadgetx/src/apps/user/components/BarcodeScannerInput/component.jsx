import React, { useState } from "react";
import { BarcodeScanner } from "react-barcode-scanner";
import { BsUpcScan } from "react-icons/bs";
import InputField from "@/components/InputField";
import "./style.scss";

const BarcodeScannerInput = ({
  searchRef,
  searchKey,
  onSearchKeyChange,
  searchType,
  onSearchTypeChange,
  onEnter,
  onScan,
  searchOptions,
  placeholder,
}) => {
  const [isCameraOn, setIsCameraOn] = useState(false);

  const handleScan = (scannedValue) => {
    if (scannedValue) {
      onScan(scannedValue);
      setIsCameraOn(false); // Stop camera after successful scan
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onEnter();
    }
  };

  return (
    <div className="barcode-input-wrapper">
      <div className="input-with-button">
        <button
          type="button"
          className={`scan-toggle-btn ${isCameraOn ? "active" : ""}`}
          onClick={() => setIsCameraOn(!isCameraOn)}
          title={isCameraOn ? "Start/Stop Scanner" : "Start Scanner"}
        >
          <BsUpcScan size={25} />
        </button>
      {isCameraOn && (
        <div className="hidden-scanner">
          <BarcodeScanner
            onUpdate={(err, result) => {
              if (result) handleScan(result.text);
            }}
            style={{ display: "none" }} // hide camera visuals
          />
        </div>
      )}
        <select
          value={searchType}
          onChange={onSearchTypeChange}
          className="search-type-select"
        >
          {searchOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.name}
            </option>
          ))}
        </select>
        <InputField
        label={searchOptions.find((option) => option.value === searchType)?.name || "Barcode"}
          ref={searchRef}
          value={searchKey}
          onChange={onSearchKeyChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Enter or scan barcode"}
        />
      </div>
    </div>
  );
};

export default BarcodeScannerInput;