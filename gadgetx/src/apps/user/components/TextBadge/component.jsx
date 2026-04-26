import React from 'react'
import './style.scss'

const getVariantClassName = (variant, type) => {
  if (!variant || !type) return ''
  const lowerCaseType = type.toLowerCase()

  switch (variant) {
    case 'paymentStatus':
      switch (lowerCaseType) {
        case 'paid':
          return 'text-badge--positive'
        case 'partial':
          return 'text-badge--neutral'
        case 'unpaid':
        case 'pending':
          return 'text-badge--negative'
        default:
          return ''
      }

    case 'transactionType':
      switch (lowerCaseType) {
        case 'service':
        case 'sale':
        case 'deposit':
        case 'finance':
        case 'received':
        case 'purchase_return':
          return 'text-badge--positive'
        case 'purchase':
        case 'partnership':
        case 'sale_return':
          return 'text-badge--neutral'
        case 'expense':
        case 'withdrawal':
          return 'text-badge--negative'
        case 'transfer':
          return 'text-badge--info'
        default:
          return ''
      }
    
    case 'accountType':
      switch (lowerCaseType) {
        case 'cash':
          return 'text-badge--info'
        case 'bank':
          return 'text-badge--positive'
        default:
          return ''
      }
      

    // NEW VARIANT ADDED
    case 'jobSheetStatus':
      switch (lowerCaseType) {
        case 'completed':
          return 'text-badge--positive'
        case 'in progress':
        case 'pending':
          return 'text-badge--neutral'
        case 'cancelled':
          return 'text-badge--negative'
        default:
          return ''
      }

    default:
      return ''
  }
}

const TextBadge = ({ variant, type, children, className = '' }) => {
  const variantClassName = getVariantClassName(variant, type)
  const combinedClassName = `text-badge ${variantClassName} ${className}`.trim()

  return <span className={combinedClassName}>{children}</span>
}

export default TextBadge