import { useState } from "react";
import JsBarcode from "jsbarcode";
import { useToast } from "@/context/ToastContext";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import InputField from "@/components/InputField";
import CancelButton from "@/components/CancelButton";
import HStack from "@/components/HStack";
import "./style.scss";

const PrintBarcodeButton = ({
  barcodeValue,
  itemName,
  itemPrice,
  storeName,
  phone, // New Prop added
  showName,
  showPrice,
  showStore,
  disabled,
  variant = "default", // 'default' or 'jobsheet'
}) => {
  const showToast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [printCount, setPrintCount] = useState(1);

  const openPrintModal = () => {
    if (!barcodeValue) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "No barcode available to print.",
        status: TOASTSTATUS.ERROR,
      });
      return;
    }
    setPrintCount(1);
    setIsModalOpen(true);
  };

  const handleConfirmPrint = () => {
    const count = parseInt(printCount, 10);
    if (isNaN(count) || count <= 0) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please enter a valid number greater than 0.",
        status: TOASTSTATUS.ERROR,
      });
      return;
    }

    // Generate Barcode SVG
    const svgNode = document.createElement("svg");
    JsBarcode(svgNode, barcodeValue, {
      format: "CODE128",
      displayValue: true,
      fontSize: 18,
      height: 50,
      margin: 0,
      textMargin: 0,
    });
    const barcodeSvgString = svgNode.outerHTML;

    const formattedPrice = itemPrice ? parseFloat(itemPrice).toFixed(2) : "";

    let innerContentHtml = "";

    if (variant === "jobsheet") {
      // --- JOBSHEET LAYOUT: Customer & Phone Left, Item Right ---
      innerContentHtml = `
        <div class="jobsheet-details">
          <div class="js-left-container">
            <span class="js-customer-name">${storeName || ""}</span>
            ${phone ? `<span class="js-phone">${phone}</span>` : ""}
          </div>
          <span class="js-right">${itemName || ""}</span>
        </div>
        ${barcodeSvgString}
      `;
    } else {
      // --- DEFAULT LAYOUT: Store Header, Item Left, Price Right ---
      let itemDetailsHtml = "";
      if (showName || showPrice) {
        const namePart =
          showName && itemName
            ? `<span class="item-name">${itemName}</span>`
            : "<span></span>";
        const pricePart =
          showPrice && formattedPrice
            ? `<span class="item-price">Price: ${formattedPrice}</span>`
            : "";
        itemDetailsHtml = `<div class="item-details">${namePart}${pricePart}</div>`;
      }

      innerContentHtml = `
        ${
          showStore && storeName
            ? `<div class="store-name">${storeName}</div>`
            : ""
        }
        ${itemDetailsHtml}
        ${barcodeSvgString}
      `;
    }

    let printHtml = `
      <html>
        <head>
          <title>Print Barcodes</title>
          <style>
            @media print {
              @page { size: auto; margin: 5mm; }
              body { margin: 0; }
            }
            body { font-family: sans-serif; }
            .barcode-container {
              display: flex;
              flex-wrap: wrap;
              gap: 15px; 
              padding: 10px;
            }
            .barcode-item {
              width: 200px;
              border: 1px solid #eee;
              padding: 5px;
              text-align: center; 
              page-break-inside: avoid;
              display: flex; 
              flex-direction: column; 
              align-items: center;
              margin-bottom: 10px;
            }
            
            /* Default Styles */
            .store-name { font-size: 14px; font-weight: bold; margin-bottom: 5px; word-wrap: break-word; }
            .item-details { display: flex; justify-content: space-between; width: 90%; font-size: 12px; margin-bottom: 2px; }
            .item-name { text-align: left; }
            .item-price { text-align: right; }
            
            /* JobSheet Specific Styles */
            .jobsheet-details { 
                display: flex; 
                justify-content: space-between; 
                align-items: flex-start;
                width: 95%; 
                margin-bottom: 2px; 
            }
            .js-left-container {
                display: flex;
                flex-direction: column;
                text-align: left;
                max-width: 55%;
            }
            .js-customer-name { 
                font-size: 12px; 
                font-weight: bold; 
                white-space: nowrap; 
                overflow: hidden; 
                text-overflow: ellipsis; 
            }
            .js-phone {
                font-size: 10px;
                font-weight: normal;
                color: #333;
            }
            .js-right { 
                text-align: right; 
                font-size: 12px;
                font-weight: bold;
                white-space: nowrap; 
                overflow: hidden; 
                text-overflow: ellipsis; 
                max-width: 40%; 
            }

            svg { width: 100%; height: auto; display: block; }
          </style>
        </head>
        <body>
          <div class="barcode-container">
    `;

    for (let i = 0; i < count; i++) {
      printHtml += `<div class="barcode-item">${innerContentHtml}</div>`;
    }

    printHtml += `</div></body></html>`;

    const printWindow = window.open("", "_blank", "height=600,width=800");
    printWindow.document.write(printHtml);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);

    setIsModalOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openPrintModal}
        disabled={disabled}
        className="barcode-section__button barcode-section__button-print"
        style={{ backgroundColor: "#007bff", color: "#fff", border: "none" }}
      >
        Print
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader>
          <h1 className="fs18 fw600">Enter Print Count</h1>
        </ModalHeader>
        <ModalBody>
          <p className="fs16 fw500" style={{ marginBottom: "16px" }}>
            How many barcode labels do you want to print?
          </p>
          <InputField
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={printCount}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/, "");
              setPrintCount(value);
            }}
            placeholder="e.g., 10"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleConfirmPrint();
              }
            }}
          />
        </ModalBody>
        <ModalFooter>
          <HStack>
            <CancelButton onClick={() => setIsModalOpen(false)} />
            <button onClick={handleConfirmPrint} className="submit_button2">
              <span className="submit_button2-text fs18 fw500">Print</span>
            </button>
          </HStack>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default PrintBarcodeButton;
