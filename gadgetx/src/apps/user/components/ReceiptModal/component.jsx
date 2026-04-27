import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReactToPrint } from "react-to-print";
import { FaPrint } from "react-icons/fa";

import CancelButton from "@/components/CancelButton";
import Button from "@/components/Button";
import ThermalReceiptInvoice from "@/apps/user/components/PrintingModels/ThermalReceiptInvoice";
import ReceiptInvoice from "@/apps/user/components/PrintingModels/ReceiptInvoice";

import "./style.scss";

const ReceiptModal = ({ isOpen, onClose, transactionData, forcedPrintType }) => {
  const printRef = useRef();
  const [data, setData] = useState(null);
  const [printType, setPrintType] = useState("thermal");

  const toNumber = (value, fallback) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const thermalPaperWidth = Math.min(
    120,
    Math.max(58, toNumber(data?.store?.paper_width_mm, 80)),
  );
  const thermalPageMargin = Math.min(
    10,
    Math.max(0, toNumber(data?.store?.print_margin_mm, 0)),
  );

  const computedPageStyle =
    printType === "thermal"
      ? `
      @page { size: ${thermalPaperWidth}mm auto; margin: ${thermalPageMargin}mm; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `
      : `
      @page { size: auto; margin: 10mm; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `;

  const triggerPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Receipt-${data?.id || "sale"}`,
    onAfterPrint: onClose,
    pageStyle: computedPageStyle,
  });

  const handlePrintClick = useCallback(() => {
    triggerPrint();
  }, [triggerPrint]);

  useEffect(() => {
    if (!isOpen || !data) return;

    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === "NumpadEnter") {
        e.preventDefault();
        handlePrintClick();
      }

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, data, handlePrintClick, onClose]);

  useEffect(() => {
    if (!transactionData) return;

    const printSettingsString = localStorage.getItem("PRINT_SETTINGS");
    const store = transactionData.store || {};

    if (printSettingsString) {
      const settings = JSON.parse(printSettingsString);
      setPrintType(forcedPrintType || settings.print_type || "thermal");

      setData({
        ...transactionData,
        store: { ...store, ...settings },
      });
    } else {
      setPrintType(forcedPrintType || "thermal");
      setData(transactionData);
    }
  }, [transactionData, isOpen, forcedPrintType]);

  if (!isOpen || data === null) return null;

  return createPortal(
    <div className="gadgetx_custom-modal__overlay">
      <div
  className={`gadgetx_custom-modal__container ${
    printType === "a4" ? "modal-a4" : "modal-thermal"
  }`}
>

        <button className="modal-close-x" onClick={onClose}>
          ✖
        </button>

        <div className="preview-container">
          {printType === "thermal" ? (
            <ThermalReceiptInvoice ref={printRef} transactionData={data} />
          ) : (
            <ReceiptInvoice ref={printRef} transactionData={data} />
          )}
        </div>

        <div className="gadgetx_custom-modal__footer">
          <CancelButton onClick={onClose} />
          <Button onClick={handlePrintClick} title="Enter" autoFocus>
            <FaPrint style={{ marginRight: "8px" }} />
            Print & Close (Enter)
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReceiptModal;