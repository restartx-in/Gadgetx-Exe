import React, { forwardRef } from "react";
import Barcode from "react-barcode";
import AmountSymbol from "@/apps/user/components/AmountSymbol";
import { isInvalidImageUrl } from "@/config/api";
import "./style.scss"; 

const safeImageUrl = (url) => (url && typeof url === "string" && !isInvalidImageUrl(url) ? url : null);


const formatAmount = (amount) => {
  const num = parseFloat(amount) || 0;
  return num.toFixed(2);
};

// --- Automatic Translations for Static Labels ---
const translations = {
  jobSheet: 'ورقة عمل',
  jobNo: 'رقم الطلب',
  date: 'التاريخ',
  status: 'الحالة',
  partyName: 'اسم العميل',
  item: 'الجهاز',
  servicer: 'الفني',
  doneBy: 'تم بواسطة',
  totalCharges: 'إجمالي الرسوم',
  remarks: 'ملاحظات',
};

const ThermalReceiptInvoice = forwardRef(({ data }, ref) => {
  // Safety check to prevent errors if data is not ready
  if (!data || !data.store) {
    return null;
  }

  // Calculations
  const serviceCost = parseFloat(data.service_cost) || 0;
  const serviceCharge = parseFloat(data.service_charges) || 0;
  const totalAmount = serviceCost + serviceCharge;

  const { store } = data;

  // Helper component to keep code clean and show paired labels
  const Label = ({ english, arabicKey }) => (
    <div className="label-pair">
      <span>{english}</span>
      {store?.show_arabic_translations && <span className="arabic-label">{translations[arabicKey]}</span>}
    </div>
  );

  return (
    <div ref={ref} className="thermal-receipt-sheet">
      
      {/* 1. HEADER */}
      <div className="thermal-header">
        {safeImageUrl(store?.full_header_image_url) && (
          <div className="header-image">
            <img
              src={safeImageUrl(store.full_header_image_url)}
              alt="Logo"
              style={{
                width: store.image_width || "auto",
                height: store.image_height || "auto",
              }}
            />
          </div>
        )}
        <h3>{store?.company_name}</h3>
        <div className="store-info">
          {store?.address && <p>{store.address}</p>}
          {store?.email && <p>Email: {store.email}</p>}
          {store?.phone && <p>Ph: {store.phone}</p>}
          {store?.tr_number && <p><strong>TRN: {store.tr_number}</strong></p>}
        </div>
      </div>

      <div className="thermal-divider" style={{ borderBottom: '1px solid #000', margin: '5px 0' }}></div>
      <h3 style={{ textAlign: "center", margin: "5px 0" }}>
        JOB SHEET
        {store?.show_arabic_translations && <div className="arabic-label" style={{ fontSize: '1em' }}>{translations.jobSheet}</div>}
      </h3>
      <div className="thermal-divider" style={{ borderBottom: '1px solid #000', margin: '5px 0 10px 0' }}></div>

      {/* 2. META INFO */}
      <div className="thermal-meta">
        <div className="meta-row">
          <Label english="Job No:" arabicKey="jobNo" />
          <strong>{data.invoice_number || "N/A"}</strong>
        </div>
        <div className="meta-row">
          <Label english="Date:" arabicKey="date" />
          <span>{new Date().toLocaleDateString("en-GB")}</span>
        </div>
        <div className="meta-row">
          <Label english="Status:" arabicKey="status" />
          <strong>{data.status}</strong>
        </div>
      </div>

      {/* 3. JOB DETAILS */}
      <div className="thermal-summary" style={{ marginBottom: '10px' }}>
        <div className="summary-row">
          <Label english="Party Name:" arabicKey="partyName" />
          <span style={{ fontWeight: 600, textAlign:'right', maxWidth: '60%' }}>{data.party_name}</span>
        </div>
        
        <div className="summary-row">
          <Label english="Item:" arabicKey="item" />
          <span style={{ textAlign:'right' }}>{data.item_name}</span>
        </div>

        <div className="summary-row">
          <Label english="Servicer:" arabicKey="servicer" />
          <span>{data.servicer_name}</span>
        </div>

        <div className="summary-row">
          <Label english="Done By:" arabicKey="doneBy" />
          <span>{data.done_by_name}</span>
        </div>
      </div>

      {/* 4. FINANCIALS */}
      <div className="thermal-summary">
        {/* Optional: Show breakdown if needed
        <div className="summary-row">
          <span>Service Cost</span>
          <AmountSymbol>{formatAmount(serviceCost)}</AmountSymbol>
        </div>
        <div className="summary-row">
          <span>Service Charge</span>
          <AmountSymbol>{formatAmount(serviceCharge)}</AmountSymbol>
        </div> 
        */}

        <div className="summary-row grand-total fw600">
          <Label english="TOTAL CHARGES" arabicKey="totalCharges" />
          <AmountSymbol>{formatAmount(totalAmount)}</AmountSymbol>
        </div>
      </div>

      {/* 5. REMARKS */}
      {data.remarks && (
        <div className="thermal-footer" style={{ marginTop: '10px', textAlign: 'left' }}>
          <strong>
            <Label english="Remarks:" arabicKey="remarks" />
          </strong>
          <p className="footer-message" style={{ marginTop: '2px', textAlign: 'left', fontWeight: 'normal' }}>{data.remarks}</p>
        </div>
      )}

      {/* 6. FOOTER (Barcode & Message) */}
      <div className="thermal-footer">
        {data.invoice_number && (
          <div className="barcode-wrap">
            <Barcode
              value={data.invoice_number}
              height={35}
              width={1.5}
              displayValue={false}
            />
          </div>
        )}

        <div className="footer-message">
          {store?.footer_message || "Thank you for your business!"}
        </div>
      </div>
    </div>
  );
});

export default ThermalReceiptInvoice;