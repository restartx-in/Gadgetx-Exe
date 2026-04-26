import { createContext, useContext, useState, useCallback } from 'react'
import CrudToast from '@/components/CrudToast'
import { TOASTTYPE } from '@/constants/object/toastType'
import Toast from '@/components/Toast'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toastData, setToastData] = useState(null)

  const showToast = useCallback((options) => {
    setToastData({
      ...options,
      type: options.type ?? TOASTTYPE.CRUD,
      isOpen: true,
    })
  }, [])

  const handleClose = () => setToastData(null)

  const ToastToRenderd = () => {
    switch (toastData.type) {
      case TOASTTYPE.CRUD:
        return (
          <CrudToast
            isOpen={toastData.isOpen}
            crudItem={toastData.crudItem}
            crudType={toastData.crudType}
            onClose={handleClose}
          />
        )
      case TOASTTYPE.GENARAL:
        return (
          <Toast
            isOpen={toastData.isOpen}
            message={toastData.message}
            status={toastData.status}
            onClose={handleClose}
          />
        )
      default:
        return null
    }
  }

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toastData && <ToastToRenderd />}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const showToastFn = useContext(ToastContext)
  if (showToastFn === null) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return showToastFn
}
