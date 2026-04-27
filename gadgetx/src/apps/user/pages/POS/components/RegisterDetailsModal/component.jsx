import React from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/Modal";
import AmountSymbol from "@/apps/user/components/AmountSymbol";

const RegisterDetailsModal = ({ isOpen, onClose, registerData }) => {
  if (!registerData) return null;

  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader>
        <h2>Register Details - ({formattedDate})</h2>
      </ModalHeader>
      <ModalBody>
        <div className="register-details-content">
          <table className="register-details-table">
            <thead>
              <tr className="table-header">
                <td>Payment Type</td>
                <td>Amount</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cash In Hand:</td>
                <td>
                  <AmountSymbol>{registerData?.cashInHand ?? 0}</AmountSymbol>
                </td>
              </tr>
              <tr>
                <td>Cash at Bank:</td>
                <td>
                  <AmountSymbol>{registerData?.cashAtBank ?? 0}</AmountSymbol>
                </td>
              </tr>
              <tr>
                <td>Change Returned:</td>
                <td>
                  <AmountSymbol>{registerData?.totalRefund ?? 0}</AmountSymbol>
                </td>
              </tr>
              <tr className="separator-row">
                <td colSpan="2"></td>
              </tr>
              <tr>
                <td>Total Sales:</td>
                <td>
                  <AmountSymbol>{registerData?.totalSales ?? 0}</AmountSymbol>
                </td>
              </tr>
              <tr className="table-header">
                <td>Total Payment:</td>
                <td>
                  <AmountSymbol>{registerData?.totalPayment ?? 0}</AmountSymbol>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ModalBody>
      <ModalFooter>
        <button className="btn-primary" onClick={() => window.print()}>
          Print
        </button>
        <button className="btn-secondary" onClick={onClose}>
          Close
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default RegisterDetailsModal;
