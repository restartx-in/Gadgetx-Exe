import React, { forwardRef } from 'react'
import Barcode from 'react-barcode'
import AmountSymbol from '@/components/AmountSymbol' 
import './style.scss'

const formatCurrency = (amount) => {
  const numericAmount = parseFloat(amount) || 0
  return numericAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// --- Automatic Translations for Static Labels ---
const translations = {
  receiptNo: 'رقم الإيصال',
  date: 'التاريخ',
  item: 'الوصف',
  qty: 'الكمية',
  price: 'السعر',
  amount: 'المبلغ',
  subtotal: 'المجموع الفرعي',
  tax: 'ضريبة',
  discount: 'خصم',
  shipping: 'شحن',
  paid: 'المدفوع',
  changeReturn: 'الباقي',
  balanceDue: 'الرصيد المستحق',
  totalTendered: 'المبلغ الإجمالي', // Corrected "Tentered Amount"
};


const ThermalReceiptInvoice = forwardRef(({ transactionData }, ref) => {
  if (!transactionData) return null

  const { store } = transactionData
  
  // Calculations
  const subTotal = parseFloat(transactionData.summary?.subTotal) || 0
  const tax = parseFloat(transactionData.summary?.orderTax) || 0
  const discount = parseFloat(transactionData.summary?.discount) || 0
  const shipping = parseFloat(transactionData.summary?.shipping) || 0
  const grandTotal = parseFloat(transactionData.summary?.grandTotal) || 0
  const paid = parseFloat(transactionData.payment?.amountPaid) || 0
  const change = parseFloat(transactionData.payment?.changeReturn) || 0
  const balance = grandTotal - paid

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
        {store?.full_header_image_url && (
          <div className="header-image">
            <img 
              src={store.full_header_image_url} 
              alt="Logo"
              style={{
                 width: store.image_width || 'auto',
                 height: store.image_height || 'auto'
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
          <strong>{transactionData.id}</strong>
        </div>
        <div className="meta-row">
          <Label english="Date:" arabicKey="date" />
          <span>{new Date(transactionData.date).toLocaleDateString('en-GB')}</span>
        </div>
        {transactionData.partner && (
          <div className="meta-row">
            <span>{transactionData.partner.label}:</span>
            <span>{transactionData.partner.name}</span>
          </div>
        )}
      </div>

      {/* 3. ITEMS (Using CSS Grid) */}
      <div className="thermal-items">
        {/* Header Row */}
        <div className="grid-row header-row">
          <span className="col-name"><Label english="Item" arabicKey="item"/></span>
          <span className="col-qty"><Label english="Qty" arabicKey="qty"/></span>
          <span className="col-price"><Label english="Price" arabicKey="price"/></span>
          <span className="col-total"><Label english="Amount" arabicKey="amount"/></span>
        </div>

        {/* Item Rows */}
        {transactionData.items?.map((item, index) => (
          <div key={index} className="grid-row">
            <span className="col-name">{item.name}</span>
            <span className="col-qty">{item.quantity}</span>
            <span className="col-price">{formatCurrency(item.price)}</span>
            <span className="col-total">{formatCurrency(item.price * item.quantity)}</span>
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
          <div className="summary-row">
            <Label english="Tax" arabicKey="tax" />
            <AmountSymbol>{formatCurrency(tax)}</AmountSymbol>
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
                  <Label english={`Paid (${transactionData.payment?.method || 'Cash'})`} arabicKey="paid" />
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
         <div className="summary-row grand-total fw600">
          <Label english="Total Tendered" arabicKey="totalTendered" />
          <AmountSymbol>{formatCurrency(grandTotal)}</AmountSymbol>
        </div>
      </div>

      {/* 5. FOOTER */}
      <div className="thermal-footer">
        {(transactionData.invoice_number || transactionData.id) && (
          <div className="barcode-wrap">
            <Barcode
              value={transactionData.invoice_number ?? transactionData.id}
              format="CODE128"
              width={1.5}
              height={40}
              displayValue={false} 
            />
          </div>
        )}
        {store?.full_qr_image_url && (
          <div className="qr-wrap">
             <img
              src={store.full_qr_image_url||""}
              alt="QR Code"
              style={{
                width: store.qr_width || '80px',
                height: store.qr_height || 'auto',
                objectFit: 'contain'
              }}
            />
          </div>
        )}
        <div className="footer-message">
          {store?.footer_message || 'Thank you for your visit!'}
        </div>
      </div>
    </div>
  )
})

export default ThermalReceiptInvoice;