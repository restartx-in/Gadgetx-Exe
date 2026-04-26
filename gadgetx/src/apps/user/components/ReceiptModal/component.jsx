import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useReactToPrint } from 'react-to-print'
import { pdf } from '@react-pdf/renderer' // Import pdf generator
import { API_FILES as server } from '@/config/api'

import CancelButton from '@/apps/user/components/CancelButton'
import SubmitButton from '@/apps/user/components/SubmitButton'
import ThermalReceiptInvoice from '@/apps/user/components/PrintingModels/ThermalReceiptInvoice'
import ReceiptInvoice from '@/apps/user/components/PrintingModels/ReceiptInvoice' // Import A4 Model
import './style.scss'

const ReceiptModal = ({ isOpen, onClose, transactionData }) => {
  const printRef = useRef()
  const [data, setData] = useState(null)
  const [printType, setPrintType] = useState('thermal') // State for print type

  // 1. Setup Thermal Print Hook
  const triggerThermalPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Receipt-${data?.id || 'sale'}`,
    pageStyle: `
      @page { size: auto; margin: 0mm; } 
      @media print { body { -webkit-print-color-adjust: exact; } }
    `
  })

  // 2. Main Print Handler (Decides based on settings)
  const handlePrintClick = async () => {
    if (printType === 'a4') {
      // --- A4 Logic: Generate PDF and Open ---
      try {
        const doc = <ReceiptInvoice transactionData={data} />
        const asPdf = pdf(doc) // Create PDF instance
        const blob = await asPdf.toBlob() // Generate Blob
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank') // Open in new tab to print
      } catch (error) {
        console.error('Error generating PDF:', error)
      }
    } else {
      // --- Thermal Logic: Use existing hook ---
      triggerThermalPrint()
    }
  }

  useEffect(() => {
    if (!transactionData) return

    const printSettingsString = localStorage.getItem('PRINT_SETTINGS')

    if (printSettingsString) {
      const settings = JSON.parse(printSettingsString)
      
      // Get Print Type
      setPrintType(settings.print_type || 'thermal')

      // Build full URLs
      if (settings.header_image_url) {
        settings.full_header_image_url = `${server}${settings.header_image_url}`
      }
      if (settings.qr_image_url) {
        settings.full_qr_image_url = `${server}${settings.qr_image_url}`
      }

      setData({
        ...transactionData,
        store: { ...transactionData.store, ...settings },
      })
    } else {
      setData(transactionData)
    }
  }, [transactionData, isOpen])

  if (!isOpen || data === null) return null

  return createPortal(
    <div className="custom-modal__overlay">
      <div className="custom-modal__container">

        {/* Close Button */}
        <button className="modal-close-x" onClick={onClose}>
          ✖
        </button>

        {/* Preview Section - ALWAYS shows Thermal View (Cleaner UI) */}
        <div className="preview-container">
          <ThermalReceiptInvoice ref={printRef} transactionData={data} />
        </div>

        {/* Footer */}
        <div className="custom-modal__footer">
          <CancelButton onClick={onClose} />

          {/* This button decides what to print based on settings */}
          <SubmitButton label="Print" onClick={handlePrintClick} />
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default ReceiptModal