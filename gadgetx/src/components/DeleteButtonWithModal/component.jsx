import { useEffect, useState } from 'react'
import { FiTrash2 } from 'react-icons/fi'
import { Modal, ModalHeader, ModalFooter, ModalBody } from '@/components/Modal'
import CancelButton from '@/apps/user/components/CancelButton'
import './style.scss'

const DeleteButtonWithModal = ({
  transaction,
  onClick,
  isLoading,
  isDeleting = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const onClose = () => setIsOpen(false)

  const handleConfirm = () => {
    if (typeof onClick === 'function') {
      onClick()
    }
    setTimeout(() => {
      setIsOpen(false)
    }, 300)
  }

  return (
    <>
      <button
        className={className || 'delete_modal_trigger_btn'}
        onClick={() => setIsOpen(!isOpen)}
      >
        <FiTrash2 className="delete_modal_trigger_btn__icon" size={18} />
      </button>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalHeader>
          <h2 className="delete_modal__popup_content-header-title">
            Confirm Delete
          </h2>
        </ModalHeader>

        <ModalBody>
            {/* IMPROVEMENT: Conditionally render the transaction name */}
            <p>
              Are you sure you want to delete
              {transaction ? <strong> {transaction}</strong> : ''}?
            </p>
        </ModalBody>

        <ModalFooter>
          <div className="delete_modal__popup_content-actions">
            <CancelButton
              className="delete_modal__popup_content-actions-btn delete_modal__popup_content-actions-close"
              onClick={onClose}
            >
              Cancel
            </CancelButton>
            <button onClick={handleConfirm} className="submit_button2">
              {isLoading ? (
                <span className="submit_button2-loader"></span>
              ) : (
                <span className="submit_button2-text fs18 fw500 ">Confirm</span>
              )}
            </button>{' '}
          </div>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default DeleteButtonWithModal
