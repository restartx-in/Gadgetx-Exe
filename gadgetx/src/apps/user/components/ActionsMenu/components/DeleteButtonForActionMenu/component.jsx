import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { FiTrash2 } from "react-icons/fi";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import CancelButton from "@/components/CancelButton";
import "./style.scss";

const DeleteButtonForActionMenu = forwardRef(
  ({ transaction, onClick, isDeleting = false }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      openModal: () => setIsOpen(true),
    }));

    useEffect(() => {
      const handleEscape = (e) => {
        if (e.key === "Escape") setIsOpen(false);
      };
      if (isOpen) document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen]);

    useEffect(() => {
      if (isOpen) document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }, [isOpen]);

    const onClose = () => setIsOpen(false);

    const handleConfirm = () => {
      if (typeof onClick === "function") {
        onClick();
      }
    };

    return (
      <>
        <div
          className="delete_modall_triggerr_btnn fs10 fw500"
          onClick={() => setIsOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && setIsOpen(true)}
          role="button"
          tabIndex={0}
        >
          <FiTrash2 className="delete_modall_triggerr_btnn__icon" size={18} />
        </div>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalHeader>
            <h2 className="delete_modall__popup_content-header-title">
              Confirm Delete
            </h2>
          </ModalHeader>

          <ModalBody>
            <div className="delete_modall__popup_content-body">
              <p>
                Are you sure you want to delete
                {transaction ? <strong> {transaction}</strong> : ""}?
              </p>
            </div>
          </ModalBody>

          <ModalFooter>
            <div className="delete_modall__popup_content-actions">
              <CancelButton onClick={onClose} />
              <button
                onClick={handleConfirm}
                className="submit_button2"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="submit_button2-loader"></span>
                ) : (
                  <span className="submit_button2-text fs18 fw500">
                    Confirm
                  </span>
                )}
              </button>
            </div>
          </ModalFooter>
        </Modal>
      </>
    );
  }
);

export default DeleteButtonForActionMenu;
