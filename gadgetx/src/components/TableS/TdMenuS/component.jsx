import { useState, useEffect } from 'react'
import './style.scss' 
import { IoEyeOutline } from 'react-icons/io5'
import { FaRegTrashCan } from 'react-icons/fa6'
import { MdOutlineModeEdit } from 'react-icons/md'
import { IoMdClose } from 'react-icons/io'
import HStack from '@/components/HStack'

const TdMenuS = ({
  onEdit,
  onView,
  onDelete,
  transaction,
  isDeleting = false,
}) => {
  return (
    <td>
      <div className="action_buttons">
        <HStack>
          <button
            className="action_buttons-btn_view"
            style={{
              height: '28px',
              width: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              borderRadius: '7px',
            }}
            onClick={onView}
          >
            <IoEyeOutline />
          </button>
          <button
            className="action_buttons-btn_edit"
            style={{
              height: '28px',
              width: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              borderRadius: '7px',
            }}
            onClick={onEdit}
          >
            <MdOutlineModeEdit />
          </button>
          <DeleteButtonWithModal
            transaction={transaction}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        </HStack>
      </div>
    </td>
  )
}

export default TdMenuS

const DeleteButtonWithModal = ({
  transaction,
  onDelete,
  isDeleting = false,
}) => {
  // Close on ESC
  const [isOpen, setIsOpen] = useState(false)
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close modal
  const onClose = () => setIsOpen(false)

  // Overlay click closes modal
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          height: '28px',
          width: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '7px',
        }}
        className="btn_delete"
      >
        <FaRegTrashCan />
      </button>
      {isOpen && (
        <div className="popup_overlay" onClick={handleOverlayClick}>
          <div className="popup_overlay__content">
            <div className="popup_overlay__content-header">
              <h2 className="popup_overlay__content-title">Confirm Delete</h2>
              <button
                className="popup_overlay__content-close_btn"
                onClick={onClose}
                aria-label="Close"
              >
                <IoMdClose size={22} />
              </button>
            </div>

            <div className="popup_overlay__content-body">
              <p>
                Are you sure you want to delete <strong>{transaction}</strong>?
              </p>
            </div>

            <div className="popup_overlay__content-actions">
              <button
                className="popup_overlay__content-btn popup_overlay__content-close"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="popup_overlay__content-btn popup_overlay__content-apply"
                onClick={() => {
                  onDelete()
                  setTimeout(() => {
                    setIsOpen(false)
                  }, 300)
                }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
