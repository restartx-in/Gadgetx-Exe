import React from 'react';
import { Modal, ModalHeader, ModalBody } from '@/components/Modal';
import { FaEdit, FaTrash } from 'react-icons/fa';

const HeldSalesModal = ({
  isOpen,
  onClose,
  heldSales,
  onResume,
  onDelete,
  customers,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} size="lg">
    <ModalHeader>
      <h2>Held Sales</h2>
    </ModalHeader>
    <ModalBody>
      <div className="modal-table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Ref. ID</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {heldSales.length > 0 ? (
              heldSales.map((sale, index) => (
                <tr key={sale.id}>
                  <td>{index + 1}</td>
                  <td>
                    {sale.selectedCustomerId
                      ? customers?.find((c) => c.id === sale.selectedCustomerId)
                          ?.name || 'Unknown Customer'
                      : 'Walk-in Customer'}
                  </td>
                  <td>{new Date(sale.id).toLocaleDateString()}</td>
                  <td>{sale.selectedCustomerId || 'N/A'}</td>
                  <td className="action-cell">
                    <button
                      className="icon-btn resume-btn"
                      onClick={() => onResume(sale.id)}
                      title="Resume"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="icon-btn delete-btn"
                      onClick={() => onDelete(sale.id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  No sales on hold.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ModalBody>
  </Modal>
);

export default HeldSalesModal;