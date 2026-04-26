import { useEffect } from 'react'
import { TOASTSTATUS } from '@/constants/object/toastType'
import './style.scss'

export default function Toast({ isOpen, message, status, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose && onClose()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  if (!isOpen) return null

  const getToastClass = () => {
    switch (status) {
      case TOASTSTATUS.SUCCESS:
        return 'success'
      case TOASTSTATUS.WARNING:
        return 'warning'
      case TOASTSTATUS.ERROR:
        return 'error'
      default:
        return 'unknown'
    }
  }

  return (
    <div className={`chakra_toast ${getToastClass()}`}>{message}</div>
  )
}


