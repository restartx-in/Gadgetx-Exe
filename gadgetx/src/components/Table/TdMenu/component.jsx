import { useState, useEffect } from 'react'
import './style.css' 
import { IoEyeOutline } from 'react-icons/io5'
import { FaRegTrashCan } from 'react-icons/fa6'
import { MdOutlineModeEdit } from 'react-icons/md'
import { Modal, ModalHeader, ModalFooter, ModalBody } from '@/components/Modal'
import CancelButton from '@/apps/user/components/CancelButton'


const TdMenu = ({
  onEdit,
  onView,
  onDelete,
  transaction,
  isDeleting = false,
}) => {
  return (
    <td>
      <div className="action-buttons">
        <button
          className="btn-view"
          style={{
            height: '32px',
            width: '32px',
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
          className="btn-edit"
          style={{
            height: '32px',
            width: '32px',
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
      </div>
    </td>
  )
}

export default TdMenu

const DeleteButtonWithModal = ({
  isLoading,
  onDelete,
  size = 'sm',
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
          height: '32px',
          width: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '7px',
        }}
        className="btn-delete"
      >
        <FaRegTrashCan />
      </button>
      <Modal isOpen={isOpen} onClose={onClose} size={size}>
        <ModalHeader>Confirm Delete</ModalHeader>
        <ModalBody>
          <p className="fs14">Are you sure you want to delete</p>
        </ModalBody>
        <ModalFooter
          style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}
        >
          <CancelButton onClick={onClose} />
          <button onClick={onDelete} className="submit_button2">
            {isLoading ? (
              <span className="submit_button2-loader"></span>
            ) : (
              <span className="submit_button2-text fs18 fw500 ">Confirm</span>
            )}
          </button>{' '}
        </ModalFooter>
      </Modal>
    </>
  )
}
