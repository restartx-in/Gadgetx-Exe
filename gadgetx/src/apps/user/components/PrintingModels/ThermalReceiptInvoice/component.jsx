import React, { forwardRef } from "react";
import Barcode from "react-barcode";
import AmountSymbol from "@/apps/user/components/AmountSymbol";
import { isInvalidImageUrl, buildUploadUrl, API_UPLOADS_BASE } from "@/config/api";
import "./style.scss";

const formatCurrency = (amount) => {
  const numericAmount = parseFloat(amount) || 0;
  return numericAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// --- Automatic Translations for Static Labels ---
const translations = {
  receiptNo: "رقم الإيصال",
  date: "التاريخ",
  item: "الوصف",
  qty: "الكمية",
  price: "السعر",
  amount: "المبلغ",
  subtotal: "المجموع الفرعي",
  tax: "ضريبة",
  discount: "خصم",
  shipping: "شحن",
  paid: "المدفوع",
  changeReturn: "الباقي",
  balanceDue: "الرصيد المستحق",
  totalTendered: "المبلغ الإجمالي",
};

const ThermalReceiptInvoice = forwardRef(({ transactionData }, ref) => {
  if (!transactionData) return null;

  const { store } = transactionData;
  const receiptNumber = String(
    transactionData.invoice_number ?? transactionData.id ?? "",
  );

  const toNumber = (value, fallback) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const paperWidthMm = clamp(toNumber(store?.paper_width_mm, 80), 58, 120);
  const printMarginMm = clamp(toNumber(store?.print_margin_mm, 0), 0, 10);
  const thermalFontSizePx = clamp(toNumber(store?.thermal_font_size_px, 13), 10, 18);
  const barcodeHeightPx = clamp(toNumber(store?.barcode_height_px, 40), 24, 80);
  const barcodeLineWidth = clamp(toNumber(store?.barcode_line_width, 1.5), 1, 3);
  const barcodeLabelMode =
    ["top", "bottom", "both", "none"].includes(store?.barcode_label_mode)
      ? store?.barcode_label_mode
      : "top";

  const showTopBarcodeLabel =
    receiptNumber && (barcodeLabelMode === "top" || barcodeLabelMode === "both");
  const showBottomBarcodeLabel =
    receiptNumber && (barcodeLabelMode === "bottom" || barcodeLabelMode === "both");

  // UPDATED: Prefer proxy path (served via API) over raw upload path (blocked by nginx)
  const fullHeaderUrl = buildUploadUrl(API_UPLOADS_BASE, store?.header_image_proxy_path || store?.header_image_url);
  const fullQrUrl = buildUploadUrl(API_UPLOADS_BASE, store?.qr_image_proxy_path || store?.qr_image_url);

  // Calculations
  const subTotal = parseFloat(transactionData.summary?.subTotal) || 0;
  const tax = parseFloat(transactionData.summary?.orderTax) || 0;
  const discount = parseFloat(transactionData.summary?.discount) || 0;
  const shipping = parseFloat(transactionData.summary?.shipping) || 0;
  const grandTotal = parseFloat(transactionData.summary?.grandTotal) || 0;
  const paid = parseFloat(transactionData.payment?.amountPaid) || 0;
  const change = parseFloat(transactionData.payment?.changeReturn) || 0;
  const balance = grandTotal - paid;

  const Label = ({ english, arabicKey }) => (
    <div className="label-pair">
      <span>{english}</span>
      {store?.show_arabic_translations && (
        <span className="arabic-label">{translations[arabicKey]}</span>
      )}
    </div>
  );

  const getItemNameClass = (name) => {
    const value = String(name || "");
    if (value.length > 42) return "col-name col-name--xs";
    if (value.length > 30) return "col-name col-name--sm";
    return "col-name";
  };

  return (
    <div
      ref={ref}
      className="thermal-receipt-sheet"
      style={{
        width: `${paperWidthMm}mm`,
        maxWidth: `${paperWidthMm}mm`,
        padding: `${printMarginMm}mm`,
        fontSize: `${thermalFontSizePx}px`,
      }}
    >
      {/* 1. HEADER */}
      <div className="thermal-header">
        {/* UPDATED: Use constructed fullHeaderUrl */}
        {fullHeaderUrl && !isInvalidImageUrl(fullHeaderUrl) && (
          <div className="header-image">
            <img
              src={fullHeaderUrl}
              alt="Logo"
              style={{
                width: store.image_width || "auto",
                height: store.image_height || "auto",
                maxWidth: "100%",
                objectFit: "contain"
              }}
            />
          </div>
        )}
        <h3>{store?.company_name}</h3>
        <div className="store-info">
          {store?.address && <p>{store.address}</p>}
          {store?.phone && <p>Ph: {store.phone}</p>}
          {store?.tr_number && <p>TRN: {store.tr_number}</p>}
        </div>
      </div>

      {/* 2. META */}
      <div className="thermal-meta">
        <div className="meta-row">
          <Label english="Receipt #:" arabicKey="receiptNo" />
          <strong>{receiptNumber}</strong>
        </div>
        <div className="meta-row">
          <Label english="Date:" arabicKey="date" />
          <span>
            {new Date(transactionData.date).toLocaleDateString("en-GB")}{" "}
            {new Date(transactionData.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        {transactionData.partner && (
          <div className="meta-row">
            <span>{transactionData.partner.label}:</span>
            <span>{transactionData.partner.name}</span>
          </div>
        )}
      </div>

      {/* 3. ITEMS */}
      <div className="thermal-items">
        <div className="grid-row header-row">
          <span className="col-name">
            <Label english="Item" arabicKey="item" />
          </span>
          <span className="col-qty">
            <Label english="Qty" arabicKey="qty" />
          </span>
          <span className="col-price">
            <Label english="Price" arabicKey="price" />
          </span>
          <span className="col-total">
            <Label english="Amount" arabicKey="amount" />
          </span>
        </div>

        {transactionData.items?.map((item, index) => (
          <div key={index} className="grid-row">
            <span className={getItemNameClass(item.name)}>{item.name}</span>
            <span className="col-qty">{item.quantity}</span>
            <span className="col-price">{formatCurrency(item.price)}</span>
            <span className="col-total">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* 4. SUMMARY */}
      <div className="thermal-summary">
        <div className="summary-row">
          <Label english="Subtotal" arabicKey="subtotal" />
          <AmountSymbol>{formatCurrency(subTotal)}</AmountSymbol>
        </div>

        {tax > 0 && (
          <div
            className="summary-row summary-row--tax"
            style={{
              opacity: 1,
              color: "#000",
              fontStyle: "normal",
              fontWeight: 700,
              fontSize: "13px",
            }}
          >
            <span
              className="summary-row__label"
              style={{ color: "#000", fontStyle: "normal", fontWeight: 700 }}
            >
              Tax (Incl.)
            </span>
            <AmountSymbol
              style={{ color: "#000", fontStyle: "normal", fontWeight: 700 }}
            >
              {formatCurrency(tax)}
            </AmountSymbol>
          </div>
        )}

        {discount > 0 && (
          <div className="summary-row">
            <Label english="Discount" arabicKey="discount" />
            <AmountSymbol>-{formatCurrency(discount)}</AmountSymbol>
          </div>
        )}

        {shipping > 0 && (
          <div className="summary-row">
            <Label english="Shipping" arabicKey="shipping" />
            <AmountSymbol>{formatCurrency(shipping)}</AmountSymbol>
          </div>
        )}

        <div className="thermal-payment">
          {transactionData.payment_methods?.length > 0 ? (
            transactionData.payment_methods.map((pm, i) => (
              <div key={i} className="payment-row">
                <span>{pm.mode_of_payment}</span>
                <AmountSymbol>{formatCurrency(pm.amount)}</AmountSymbol>
              </div>
            ))
          ) : (
            <div className="payment-row">
              <Label
                english={`Paid (${transactionData.payment?.method || "Cash"})`}
                arabicKey="paid"
              />
              <AmountSymbol>{formatCurrency(paid)}</AmountSymbol>
            </div>
          )}
        </div>

        {change > 0 && (
          <div className="summary-row">
            <Label english="Change Return" arabicKey="changeReturn" />
            <AmountSymbol>{formatCurrency(change)}</AmountSymbol>
          </div>
        )}

        {balance > 0.01 && (
          <div className="summary-row balance-due">
            <Label english="Balance Due" arabicKey="balanceDue" />
            <AmountSymbol>{formatCurrency(balance)}</AmountSymbol>
          </div>
        )}
        <div className="summary-row grand-total">
          <Label english="GRAND TOTAL" arabicKey="totalTendered" />
          <AmountSymbol>{formatCurrency(grandTotal)}</AmountSymbol>
        </div>
        {balance <= 0.01 && paid > 0 && (
          <div className="paid-stamp">✓ PAID IN FULL</div>
        )}
      </div>

      {/* 5. FOOTER */}
      <div className="thermal-footer">
        {receiptNumber && (
          <div className="barcode-wrap">
            {showTopBarcodeLabel && (
              <div
                className="barcode-number barcode-number--top"
                style={{
                  color: "#000",
                  fontSize: "12px",
                  fontWeight: 700,
                  fontStyle: "normal",
                  letterSpacing: "0.4px",
                  marginBottom: "4px",
                }}
              >
                Receipt No: {receiptNumber}
              </div>
            )}
            <Barcode
              value={receiptNumber}
              format="CODE128"
              width={barcodeLineWidth}
              height={barcodeHeightPx}
              lineColor="#000"
              background="#fff"
              margin={0}
              displayValue={false}
            />
            {showBottomBarcodeLabel && (
              <div
                className="barcode-number"
                style={{
                  color: "#000",
                  fontSize: "12px",
                  fontWeight: 700,
                  fontStyle: "normal",
                  letterSpacing: "1px",
                  marginTop: "4px",
                }}
              >
                {receiptNumber}
              </div>
            )}
          </div>
        )}
        
        {/* UPDATED: Construct and use fullQrUrl */}
        {fullQrUrl && !isInvalidImageUrl(fullQrUrl) && store?.show_qr_code !== false && (
          <div className="qr-wrap">
            <img
              src={fullQrUrl}
              alt="QR Code"
              style={{
                width: store.qr_width || "80px",
                height: store.qr_height || "auto",
                objectFit: "contain",
              }}
            />
          </div>
        )}
        <div className="footer-message">
          {store?.footer_message || "Thank you for your visit!"}
        </div>
      </div>
    </div>
  );
});

export default ThermalReceiptInvoice;