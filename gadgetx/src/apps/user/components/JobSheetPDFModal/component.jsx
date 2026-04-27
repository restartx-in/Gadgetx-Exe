import React, { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import JobSheetPDF from "@/apps/user/components/JobSheetPDF";
import useJobSheetById from "@/apps/user/hooks/api/jobSheets/useJobSheetById";
import Loader from "@/components/Loader";
import "./style.scss"; // Ensure this file is styled like ReceiptModal's CSS

// Consistent currency formatting function
const formatCurrency = (amount) => {
  const numericAmount = parseFloat(amount) || 0;
  return numericAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const JobSheetPDFModal = ({ isOpen, onClose, jobSheetId }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    data: jobSheetData,
    isLoading,
    error,
  } = useJobSheetById(jobSheetId, {
    enabled: isOpen && !!jobSheetId,
  });

  const handleDownloadPDF = async () => {
    if (!jobSheetData) return;
    setIsGenerating(true);

    try {
      const blob = await pdf(
        <JobSheetPDF jobSheetData={jobSheetData} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `JobSheet-${jobSheetData.job_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="receipt-modal__status-container">
          <Loader />
          <p>Fetching Job Sheet details...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="receipt-modal__status-container receipt-modal__error">
          <p>Error: Could not fetch job sheet details.</p>
          <p className="receipt-modal__error-message">{error.message}</p>
        </div>
      );
    }

    if (jobSheetData) {
      return (
        <>
          <div className="receipt-modal__meta-details">
            <p>
              <strong>Job ID:</strong> {jobSheetData.job_id}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(jobSheetData.created_at).toLocaleDateString("en-GB")}
            </p>
            <p>
              <strong>Customer:</strong> {jobSheetData.party_name}
            </p>

            <p>
              <strong>Item:</strong> {jobSheetData.item_name}
            </p>
            <p>
              <strong>Status:</strong> {jobSheetData.status}
            </p>
          </div>
          <hr className="receipt-modal__item-separator" />
          <div className="receipt-modal__section">
            <h4>Issue Reported</h4>
            <p>{jobSheetData.issue_reported}</p>
          </div>
          <div className="receipt-modal__section">
            <h4>Diagnosis</h4>
            <p>{jobSheetData.diagnosis}</p>
          </div>
          <hr className="receipt-modal__item-separator" />
          <div className="receipt-modal__summary">
            <div className="receipt-modal__summary-row grand-total">
              <span className="label">Service Charges:</span>
              <span className="filler"></span>
              <span className="value">
                {formatCurrency(jobSheetData.service_charges)}
              </span>
            </div>
          </div>
          <div className="receipt-modal__footer-message">
            {/* <p>Thanks for your business!</p> */}
          </div>
        </>
      );
    }

    return null;
  };

  const isDownloadDisabled =
    isLoading || !!error || !jobSheetData || isGenerating;

  return (
    // Using the same class names as ReceiptModal for consistent styling
    <div
      className="receipt-modal__overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="receipt-modal__content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="receipt-modal__header">
          <h2 className="receipt-modal__title">Job Sheet</h2>
          <button
            className="receipt-modal__close-btn-icon"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="receipt-modal__body">{renderContent()}</div>
        <div className="receipt-modal__footer">
          <button className="receipt-modal__close-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="receipt-modal__download-btn"
            onClick={handleDownloadPDF}
            disabled={isDownloadDisabled}
          >
            {isGenerating ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobSheetPDFModal;
