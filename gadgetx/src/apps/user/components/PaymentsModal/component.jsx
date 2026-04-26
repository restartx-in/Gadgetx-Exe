import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TdNumeric,
  ThSL,
  TdSL,
  TdDate,
  TableCaption,
  ThContainer
} from '@/components/Table'; // Adjust path if necessary based on your folder structure
import './style.scss';

const PaymentsModal = ({ isOpen, onClose, payments, type }) => {
  // Prevent rendering if not open
  if (!isOpen) {
    return null;
  }

  // Determine Table Headers based on transaction type
  const renderHeaders = () => {
    switch (type) {
      case 'sale':
        return (
          <>
            <Th><ThContainer>Amount</ThContainer></Th>
            <Th><ThContainer>Received From</ThContainer></Th>
            <Th><ThContainer>Received To</ThContainer></Th>
          </>
        );
      case 'sale_return':
        return (
          <>
            <Th><ThContainer>Refund Amount</ThContainer></Th>
            <Th><ThContainer>Return From</ThContainer></Th>
            <Th><ThContainer>Return To</ThContainer></Th>
          </>
        );
      case 'purchase':
        return (
          <>
            <Th><ThContainer>Amount</ThContainer></Th>
            <Th><ThContainer>Paid From</ThContainer></Th>
          </>
        );
      case 'purchase_return':
        return (
          <>
            <Th><ThContainer>Amount</ThContainer></Th>
            <Th><ThContainer>Paid To</ThContainer></Th>
          </>
        );
      default:
        return <Th><ThContainer>Amount</ThContainer></Th>;
    }
  };

  const renderRows = (payment) => {
    switch (type) {
      case 'sale':
        return (
          <>
            <TdNumeric>{(parseFloat(payment.amount) || 0).toFixed(2)}</TdNumeric>
            <Td>{payment.customerName || '-'}</Td>
            <Td>{payment.receivedTo || '-'}</Td>
          </>
        );
      case 'sale_return':
        return (
          <>
            <TdNumeric>{(parseFloat(payment.amount) || 0).toFixed(2)}</TdNumeric>
            <Td>{payment.customerName || '-'}</Td>
            <Td>{payment.returnedTo || '-'}</Td>
          </>
        );
      case 'purchase':
        return (
          <>
            <TdNumeric>{(parseFloat(payment.amount) || 0).toFixed(2)}</TdNumeric>
            <Td>{payment.paidFrom || '-'}</Td>
          </>
        );
      case 'purchase_return':
        return (
          <>
            <TdNumeric>{(parseFloat(payment.amount) || 0).toFixed(2)}</TdNumeric>
            <Td>{payment.paidTo || '-'}</Td>
          </>
        );
      default:
        return <TdNumeric>{(parseFloat(payment.amount) || 0).toFixed(2)}</TdNumeric>;
    }
  };

  // Helper to determine column span for empty state
  const getNumberOfColumns = () => {
    switch (type) {
      case 'sale': return 5; // SL + Date + Amount + From + To
      case 'sale_return': return 5;
      case 'purchase': return 4; // SL + Date + Amount + From
      case 'purchase_return': return 4;
      default: return 3;
    }
  };

  return (
    <div className="payments_modal-overlay" onClick={onClose}>
      <div 
        className="payments_modal-content" 
        onClick={(e) => e.stopPropagation()} // Prevent click from closing modal when clicking inside
      >
        <div className="payments_modal-header">
          <h2>Show Payments</h2>
          <button className="close-button" onClick={onClose} title="Close">
            &times;
          </button>
        </div>
        
        <div className="payments_modal-body">
          <Table>
            <Thead>
              <Tr>
                <ThSL />
                <Th><ThContainer>Date</ThContainer></Th>
                {renderHeaders()}
              </Tr>
            </Thead>
            <Tbody>
              {payments && payments.length > 0 ? (
                payments.map((payment, index) => (
                  <Tr key={payment.id || index}>
                    <TdSL index={index} page={1} pageSize={payments.length} />
                    <TdDate>{payment.date}</TdDate>
                    {renderRows(payment)}
                  </Tr>
                ))
              ) : (
                <TableCaption item="Payments" noOfCol={getNumberOfColumns()} />
              )}
            </Tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default PaymentsModal;