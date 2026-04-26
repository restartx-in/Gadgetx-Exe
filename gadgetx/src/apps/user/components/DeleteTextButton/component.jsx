import { useState } from 'react'
import { Modal, ModalHeader, ModalFooter, ModalBody } from '@/components/Modal'
import CancelButton from '@/apps/user/components/CancelButton'
import './style.scss'

const DeleteTextButton = ({
  isLoading,
  transaction,
  onDelete,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const onClose = () => setIsOpen(false)

  return (
    <>
      {/* The trigger remains a text button */}
      <button
        className={className || 'delete_text_btn_trigger_btn fs16 fw500'}
        onClick={() => setIsOpen(true)}
      >
        Delete
      </button>

      {/* Use the reusable Modal component */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalHeader>
          <h2 className="delete_text_btn__popup_content-header-title">
            Confirm Delete
          </h2>
        </ModalHeader>

        <ModalBody>
          <div className="delete_text_btn__popup_content-body">
            <p>
              Are you sure you want to delete <strong>{transaction}</strong>?
            </p>
          </div>
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

export default DeleteTextButton
