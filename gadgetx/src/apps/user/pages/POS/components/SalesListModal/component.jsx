import React from "react";
import { useNavigate } from "react-router-dom";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/Modal";
import useSalesPaginated from "@/hooks/api/sales/useSalesPaginated";
import Loader from "@/components/Loader";
import EditButton from "@/components/EditButton";
import HStack from "@/components/HStack";
import AmountSymbol from "@/components/AmountSymbol";
import "./style.scss";

const SalesListModal = ({ isOpen, onClose, filters, title, modalType }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useSalesPaginated({ ...filters, enabled: isOpen });

  const handlePrint = () => {
    const printContent = document.getElementById("printable-sales-table");
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <link rel="stylesheet" href="${window.location.origin}/style.css" />
        </head>
        <body>
          <h2 class="print-title">${title}</h2>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleEdit = (saleId) => {
    navigate(`/sale/edit/${saleId}`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalHeader>
        <h2>{title}</h2>
      </ModalHeader>

      <ModalBody>
        {isLoading ? (
          <Loader />
        ) : (
          <div id="printable-sales-table" className="modal-table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  {modalType === "recent" && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {data?.data?.length > 0 ? (
                  data.data.map((sale) => (
                    <tr key={sale.id}>
                      <td>{sale.invoice_number || sale.id}</td>
                      <td>{sale.customer_name}</td>
                      <td>
                        <AmountSymbol>{sale.total_amount || 0}</AmountSymbol>
                      </td>
                      <td>
                        <span
                          className={`status-badge status-${sale.status?.toLowerCase()}`}
                        >
                          {sale.status}
                        </span>
                      </td>
                      {modalType === "recent" && (
                        <td>
                          <EditButton
                            onClick={() => handleEdit(sale.id)}
                            className="edit-btn"
                          >
                            Edit
                          </EditButton>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={modalType === "recent" ? 5 : 4} className="no-data">
                      No sales found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <HStack>
          {modalType === "sales" && (
            <button className="btn-primary" onClick={handlePrint}>
              Print
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </HStack>
      </ModalFooter>
    </Modal>
  );
};

export default SalesListModal;
