import { useState, useEffect } from "react";
import "./style.scss";
import { IoEyeOutline } from "react-icons/io5";
import { FaRegTrashCan } from "react-icons/fa6";
import { MdOutlineModeEdit } from "react-icons/md";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import CancelButton from "@/components/CancelButton";

const TdMenu = ({
  onEdit = null,
  onView = null,
  onDelete = null,
  transaction,
  isDeleting = false,
}) => {
  // If no actions are provided, render empty cell
  if (!onEdit && !onView && !onDelete) {
    return <td />;
  }

  return (
    <td>
      <div className="action-buttons">
        {/* VIEW */}
        {onView && (
          <button className="btn-view" style={buttonStyle} onClick={onView}>
            <IoEyeOutline />
          </button>
        )}

        {/* EDIT */}
        {onEdit && (
          <button className="btn-edit" style={buttonStyle} onClick={onEdit}>
            <MdOutlineModeEdit />
          </button>
        )}

        {/* DELETE */}
        {onDelete && (
          <DeleteButtonWithModal
            transaction={transaction}
            onDelete={onDelete}
            isLoading={isDeleting}
          />
        )}
      </div>
    </td>
  );
};

export default TdMenu;

const buttonStyle = {
  height: "32px",
  width: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  borderRadius: "7px",
};

const DeleteButtonWithModal = ({ isLoading, onDelete, size = "sm" }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => (document.body.style.overflow = "unset");
  }, [isOpen]);

  const onClose = () => setIsOpen(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-delete"
        style={buttonStyle}
      >
        <FaRegTrashCan />
      </button>

      <Modal isOpen={isOpen} onClose={onClose} size={size}>
        <ModalHeader
          onClose={onClose}
          style={{ fontSize: "18px", fontWeight: 600 }}
        >
          Confirm Delete
        </ModalHeader>

        <ModalBody>
          <p className="fs14">Are you sure you want to delete?</p>
        </ModalBody>

        <ModalFooter
          style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
        >
          <CancelButton onClick={onClose} />
          <button onClick={onDelete} className="submit_button2">
            {isLoading ? (
              <span className="submit_button2-loader" />
            ) : (
              <span className="submit_button2-text fs18 fw500">Confirm</span>
            )}
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
};
