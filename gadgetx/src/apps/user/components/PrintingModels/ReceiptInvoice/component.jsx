import React, { forwardRef } from "react";
import { isInvalidImageUrl, buildUploadUrl, API_UPLOADS_BASE } from "@/config/api";
import "./style.scss"; 

// Translations
const translations = {
  invoice: "فاتورة",
  invoiceNo: "رقم الفاتورة",
  date: "التاريخ",
  status: "الحالة",
  paid: "مدفوع",
  pending: "قيد الانتظار",
  billTo: "الفاتورة إلى",
  itemNo: "#",
  itemDescription: "وصف السلعة",
  qty: "الكمية",
  price: "السعر",
  total: "المجموع",
  subTotal: "المجموع الفرعي",
  tax: "ضريبة",
  discount: "خصم",
  shipping: "شحن",
  grandTotal: "المجموع الإجمالي",
  paidAmount: "المبلغ المدفوع",
  balanceDue: "الرصيد المستحق",
  terms: "الأحكام والشروط",
  generated: "فاتورة صادرة من الحاسوب",
};

const formatCurrency = (amount) => {
  const numericAmount = parseFloat(amount) || 0;
  return numericAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const ReceiptInvoice = forwardRef(({ transactionData }, ref) => {
  if (!transactionData || !transactionData.store) {
    return null;
  }

  const { store, partner, items, summary, payment } = transactionData;
  const showArabic = store?.show_arabic_translations;

  // Construct URLs — prefer proxy path (served via API) over raw upload path (blocked by nginx)
  const fullHeaderUrl = buildUploadUrl(API_UPLOADS_BASE, store?.header_image_proxy_path || store?.header_image_url || store?.full_header_image_url);
  const fullQrUrl = buildUploadUrl(API_UPLOADS_BASE, store?.qr_image_proxy_path || store?.qr_image_url || store?.full_qr_image_url);

  // Calculations
  const subTotal = parseFloat(summary?.subTotal) || 0;
  const tax = parseFloat(summary?.orderTax) || 0;
  const discount = parseFloat(summary?.discount) || 0;
  const shipping = parseFloat(summary?.shipping) || 0;
  const grandTotal = parseFloat(summary?.grandTotal) || 0;
  const paid = parseFloat(payment?.amountPaid) || 0;
  const balance = grandTotal - paid;
  const isPaid = paid >= grandTotal;

  return (
    <div ref={ref} className="invoice-sheet-a4">
      {/* --- HEADER --- */}
      <div className="invoice-header">
        <div className="company-info">
          {fullHeaderUrl && !isInvalidImageUrl(fullHeaderUrl) && (
            <img src={fullHeaderUrl} alt="Logo" className="logo-image" />
          )}
          <h1 className="company-name">{store?.company_name}</h1>
          <div className="company-details">
            {store?.address && <div>{store.address}</div>}
            {store?.email && <div>{store.email}</div>}
            {store?.phone && <div>{store.phone}</div>}
            {store?.tr_number && <div>TRN: {store.tr_number}</div>}
          </div>
        </div>

        <div className="invoice-meta">
          <div className="title-row">
            <span className="en">INVOICE</span>
            {showArabic && <span className="ar">{translations.invoice}</span>}
          </div>

          <div className="meta-row">
            <span className="label">Invoice # {showArabic && <span className="ar">{translations.invoiceNo}</span>}:</span>
            <span className="value">{transactionData.id}</span>
          </div>

          <div className="meta-row">
            <span className="label">Date {showArabic && <span className="ar">{translations.date}</span>}:</span>
            <span className="value">{new Date(transactionData.date).toLocaleDateString("en-GB")}</span>
          </div>

          <div className="meta-row">
            <span className="label">Status {showArabic && <span className="ar">{translations.status}</span>}:</span>
            <span className={`value status ${isPaid ? "paid" : "pending"}`}>
              {isPaid ? "PAID" : "PENDING"}
            </span>
          </div>
        </div>
      </div>

      {/* --- BILL TO --- */}
      {partner && (
        <div className="invoice-bill-to">
          <div className="section-title">
            Bill To: {showArabic && <span className="ar">{translations.billTo}</span>}
          </div>
          <div className="partner-name">{partner.name}</div>
          {partner.phone && <div className="partner-detail">Ph: {partner.phone}</div>}
          {partner.address && <div className="partner-detail">{partner.address}</div>}
        </div>
      )}

      {/* --- ITEMS TABLE --- */}
      <div className="invoice-items-container">
        <table className="invoice-table">
          <thead>
            <tr>
              <th className="col-idx"># {showArabic && <span className="ar">{translations.itemNo}</span>}</th>
              <th className="col-desc">Item Description {showArabic && <span className="ar">{translations.itemDescription}</span>}</th>
              <th className="col-qty">Qty {showArabic && <span className="ar">{translations.qty}</span>}</th>
              <th className="col-price">Price {showArabic && <span className="ar">{translations.price}</span>}</th>
              <th className="col-total">Total {showArabic && <span className="ar">{translations.total}</span>}</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item, index) => (
              <tr key={index}>
                <td className="col-idx">{index + 1}</td>
                <td className="col-desc">{item.name}</td>
                <td className="col-qty">{item.quantity}</td>
                <td className="col-price">{formatCurrency(item.price)}</td>
                <td className="col-total">{formatCurrency(item.quantity * item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- FOOTER SECTION --- */}
      <div className="invoice-footer-section">
        <div className="footer-left">
          <div className="terms-title">
            Terms & Conditions: {showArabic && <span className="ar">{translations.terms}</span>}
          </div>
          <div className="terms-text">
            {store?.footer_message || "Thank you for your business. Goods once sold will not be taken back."}
          </div>
          {fullQrUrl && !isInvalidImageUrl(fullQrUrl) && (
            <div className="footer-qr">
              <img src={fullQrUrl} alt="QR" />
            </div>
          )}
        </div>

        <div className="footer-right">
          <div className="summary-row">
            <span className="lbl">Sub Total {showArabic && <span className="ar">{translations.subTotal}</span>}</span>
            <span className="val">{formatCurrency(subTotal)}</span>
          </div>
          {tax > 0 && (
            <div className="summary-row">
              <span className="lbl">Tax {showArabic && <span className="ar">{translations.tax}</span>}</span>
              <span className="val">{formatCurrency(tax)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="summary-row">
              <span className="lbl">Discount {showArabic && <span className="ar">{translations.discount}</span>}</span>
              <span className="val">- {formatCurrency(discount)}</span>
            </div>
          )}
          {shipping > 0 && (
            <div className="summary-row">
              <span className="lbl">Shipping {showArabic && <span className="ar">{translations.shipping}</span>}</span>
              <span className="val">{formatCurrency(shipping)}</span>
            </div>
          )}
          
          <div className="summary-row grand-total-row">
            <span className="lbl">Total {showArabic && <span className="ar">{translations.grandTotal}</span>}</span>
            <span className="val">{formatCurrency(grandTotal)}</span>
          </div>

          <div className="payment-info">
            <div className="summary-row">
              <span className="lbl">Paid {showArabic && <span className="ar">{translations.paidAmount}</span>}</span>
              <span className="val">{formatCurrency(paid)}</span>
            </div>
            {balance > 0.01 && (
              <div className="summary-row balance-row">
                <span className="lbl">Balance Due {showArabic && <span className="ar">{translations.balanceDue}</span>}</span>
                <span className="val">{formatCurrency(balance)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="generated-footer">
        Computer Generated Invoice {showArabic && <span className="ar">- {translations.generated}</span>}
      </div>
    </div>
  );
});

export default ReceiptInvoice;