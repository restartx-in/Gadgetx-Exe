import React, { useState } from "react";
import { FaDownload } from "react-icons/fa";
import HStack from "@/components/HStack";
import CancelButton from "@/components/CancelButton";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/Modal";
import "./style.scss";

const DownloadButton = ({
  onClick,
  isLoading,
  modalTitle = "Confirm Download",
  modalBody = "Are you sure you want to download this file?",
  ...rest
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirm = () => {
    handleCloseModal();
    if (onClick) {
      onClick();
    }
  };

  return (
    <>
      <button
        className="download-button"
        onClick={handleOpenModal}
        disabled={isLoading}
        {...rest}
      >
        {isLoading ? (
          <span className="download-button-loader"></span>
        ) : (
          <FaDownload />
        )}
      </button>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <ModalHeader className="fs16 fw600" onClose={handleCloseModal}>
          <h1 className="fs18 fw600">{modalTitle}</h1>
        </ModalHeader>
        <ModalBody>
          <p className="fs16 fw400">{modalBody}</p>
        </ModalBody>
        <ModalFooter>
          <HStack>
            <CancelButton onClick={handleCloseModal}>Cancel</CancelButton>
            <button onClick={handleConfirm} className="submit_button2">
              <span className="submit_button2-text fs18 fw500">Download</span>
            </button>
          </HStack>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default DownloadButton;
