import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useReactToPrint } from "react-to-print";
import { pdf } from "@react-pdf/renderer"; // Import PDF generator
import { API_FILES as server } from "@/config/api";
import ThermalReceiptInvoice from "@/apps/user/components/JobSheetPrintingModels/ThermalReceiptInvoice";
// Uncomment your A4 component
import ReceiptInvoice from "@/apps/user/components/JobSheetPrintingModels/ReceiptInvoice"; 
import CancelButton from "@/apps/user/components/CancelButton";
import SubmitButton from "@/apps/user/components/SubmitButton";
import "./style.scss";

const JobSheetInvoiceModal = ({ isOpen, onClose, invoiceData }) => {
  const printRef = useRef();
  const [data, setData] = useState(null);
  const [printType, setPrintType] = useState('thermal');

  // Thermal Print Hook
  const triggerThermalPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `JobSheet_${data?.invoice_number || 'Print'}`,
    pageStyle: `
      @page { size: auto; margin: 0mm; } 
      @media print { body { -webkit-print-color-adjust: exact; } }
    `
  });

  // Handle Print Click based on settings
  const handlePrintClick = async () => {
    if (printType === 'a4') {
        try {
            // Generate A4 PDF in a new tab
            const doc = <ReceiptInvoice data={data} />;
            const asPdf = pdf(doc);
            const blob = await asPdf.toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error generating Job Sheet PDF", error);
        }
    } else {
        // Trigger Thermal Print
        triggerThermalPrint();
    }
  };

  useEffect(() => {
    if (isOpen && invoiceData) {
      // 1. Fetch Settings
      const storedSettings = localStorage.getItem("JOB_SHEET_PRINT_SETTINGS");
      const fallbackSettings = localStorage.getItem("PRINT_SETTINGS");
      const printSettingsString = storedSettings || fallbackSettings;

      let processedStore = {
         company_name: "Default Company", 
         footer_message: "Thank you!" 
      };
      
      let type = 'thermal';

      if (printSettingsString) {
        const settings = JSON.parse(printSettingsString);

        // Get Print Type
        type = settings.print_type || 'thermal';

        // 2. Resolve Image URLs
        if (settings.header_image_url) {
          settings.full_header_image_url = `${server}${settings.header_image_url}`;
        }
        if (settings.qr_image_url) {
          settings.full_qr_image_url = `${server}${settings.qr_image_url}`;
        }
        
        processedStore = settings;
      }
      
      setPrintType(type);
      // 3. Set Data
      setData({ ...invoiceData, store: processedStore });
    }
  }, [invoiceData, isOpen]);

  if (!isOpen || data === null) return null;

  return createPortal(
    <div className="JobSheet_custom-modal__overlay" style={{ zIndex: "10000" }}>
      <div className="JobSheet_custom-modal__container">
        
        <button className="modal-close-x" onClick={onClose}>
          ✖
        </button>

        {/* VISUAL PREVIEW - Always show Thermal View for simplicity */}
        <div style={{  overflowY: "auto",  padding: "10px" }}>
          <ThermalReceiptInvoice ref={printRef} data={data} />
        </div>

        {/* FOOTER ACTIONS */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <CancelButton onClick={onClose} />

          {/* Single Print Button - behavior changes based on setting */}
          <SubmitButton label="Print" onClick={handlePrintClick} />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default JobSheetInvoiceModal;