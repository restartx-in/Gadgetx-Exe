import { useEffect } from 'react';
import { Modal, ModalHeader, ModalFooter, ModalBody } from '@/components/Modal';
import CancelButton from '@/apps/user/components/CancelButton';
import './style.scss';

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  transactionName,
  isLoading = false,
}) => {
  // Close modal on escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>
        <h2 className="delete_modal__popup_content-header-title fs16">
          Confirm Delete
        </h2>
      </ModalHeader>

      <ModalBody>
        <p className="fs14">
          Are you sure you want to delete
          {transactionName ? <strong> {transactionName}</strong> : ' this item'} ?

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
          <button onClick={onConfirm} className="submit_button2" disabled={isLoading}>
            {isLoading ? (
              <span className="submit_button2-loader"></span>
            ) : (
              <span className="submit_button2-text fs18 fw500">Confirm</span>
            )}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteConfirmationModal;