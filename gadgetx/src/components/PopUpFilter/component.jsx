import React from "react";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import FilterButton from "@/components/FilterButton";

const PopUpFilter = ({
  isOpen,
  setIsOpen,
  onApply,
  children,
  isLoading,
  size = "lg",
}) => {
  const handleClose = () => {
    setIsOpen(false);
  };

  const handleApply = () => {
    if (onApply) {
      onApply();
    }
    handleClose();
  };

  return (
    <>
      <FilterButton onClick={() => setIsOpen(true)}>Filter</FilterButton>

      <Modal isOpen={isOpen} onClose={handleClose} size={size}>
        <div className="filter fs28 fw500">
          <ModalHeader onClose={handleClose}>Filter</ModalHeader>
        </div>
        <ModalBody>{children}</ModalBody>
        <ModalFooter
          style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
        >
          <CancelButton onClick={handleClose} />
          <button onClick={handleApply} className="submit_button2">
            {isLoading ? (
              <span className="submit_button2-loader"></span>
            ) : (
              <span className="submit_button2-text fs18 fw500 ">Apply</span>
            )}
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default PopUpFilter;
