import './style.scss'
import AmountSymbol from '@/components/AmountSymbol'
import CancelButton from '@/apps/user/components/CancelButton'
import SubmitButton from '@/apps/user/components/SubmitButton'
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useReactToPrint } from 'react-to-print'
import { API_FILES as server } from '@/config/api'

const PrintableInvoice = React.forwardRef(({ invoiceData }, ref) => (
  <div ref={ref} className="invoice-modal__body">
    <div className="invoice-modal__header-image">
      {invoiceData?.store?.header_image_url && (
        <img
          src={invoiceData.store.header_image_url}
          alt="Company Logo"
          className="store-logo"
        />
      )}
    </div>

    <div className="invoice-modal__store-details">
      <h3>{invoiceData?.store.company_name}</h3>
    </div>

    <div className="invoice-modal__meta-details">
      <p>
        Date:{' '}
        {(() => {
          const d = new Date(invoiceData?.date)
          const day = String(d.getDate()).padStart(2, '0')
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const year = d.getFullYear()
          return `${day}-${month}-${year}`
        })()}
      </p>
      <p>Store: {invoiceData?.store.store}</p>
      <p>Address: {invoiceData?.store.address}</p>
      <p>Email: {invoiceData?.store.email}</p>
      <p>Phone: {invoiceData?.store.phone}</p>
      <p>Invoice No: {invoiceData?.invoiceNo}</p>
    </div>

    <div className="invoice-modal__items-list">
      {invoiceData?.items?.map((item, index) => (
        <div key={index} className="invoice-modal__item">
          <div
            className="invoice-modal__item-line"
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
            <span className="invoice-modal__item-name">{item.name}</span>
            <AmountSymbol>
              {(item.quantity * item.price).toFixed(2)}
            </AmountSymbol>
          </div>
          <div className="invoice-modal__item-line">
            <span className="invoice-modal__item-detail">
              {item.quantity} × {item.price.toFixed(2)}
            </span>
          </div>
          {index !== invoiceData?.items.length - 1 && (
            <hr className="invoice-modal__item-separator" />
          )}
        </div>
      ))}
    </div>

    <div className="invoice-modal__summary">
      <div className="invoice-modal__summary-row">
        <span className="label">Total Amount:</span>
        <AmountSymbol>{invoiceData?.summary.subTotal}</AmountSymbol>
      </div>
      <div className="invoice-modal__summary-row">
        <span className="label">Order Tax:</span>
        <AmountSymbol>{invoiceData?.summary.orderTax}</AmountSymbol>
      </div>
      <div className="invoice-modal__summary-row">
        <span className="label">Discount:</span>
        <AmountSymbol>{invoiceData?.summary.discount}</AmountSymbol>
      </div>
      <div className="invoice-modal__summary-row grand-total">
        <span className="label">Grand Total:</span>
        <AmountSymbol>{invoiceData?.summary.grandTotal}</AmountSymbol>
      </div>
    </div>

    <div className="invoice-modal__footer-message">
      <p>Thanks for your order!</p>
    </div>
  </div>
))

const InvoiceModal = ({ isOpen, onClose, invoiceData }) => {
  const printRef = useRef()

  // ✅ react-to-print v3+ fix
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Sales Report',
  })

  const [data, setData] = useState(null)

  useEffect(() => {
    
    if (isOpen && invoiceData) {
       const test = localStorage.getItem('PRINT_SETTINGS')
      const printSettingsString = JSON.parse(test)

      if (printSettingsString) {
        let settings =printSettingsString

        if (settings.header_image_url) {
          const serverBase = server.endsWith('/') ? server.slice(0, -1) : server
          const imagePath = settings.header_image_url.startsWith('/')
            ? settings.header_image_url
            : `/${settings.header_image_url}`
          settings.header_image_url = `${serverBase}${imagePath}`
        }
      setData({
        ...invoiceData,
        store: settings,
      })
    } else if (invoiceData) {
      setData(invoiceData)
    }
    }
  }, [invoiceData, isOpen])

  if (!isOpen || data === null) return null

  return createPortal(
    <div className="custom-modal__overlay">
      <div className="custom-modal__container">
        <PrintableInvoice ref={printRef} invoiceData={data} />

        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '16px',
          }}>
          <CancelButton onClick={onClose} />
          <SubmitButton label="Print" onClick={handlePrint} />
        </div>
      </div>
    </div>,
    document.body
  )
}

export default InvoiceModal
