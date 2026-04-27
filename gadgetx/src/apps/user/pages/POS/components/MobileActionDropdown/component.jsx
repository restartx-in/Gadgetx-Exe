import React, { useState, useEffect, useRef } from 'react';
import {
  FaThList,
  FaPauseCircle,
  FaHistory,
  FaTachometerAlt,
  FaClipboardList,
  FaCashRegister,
  FaEllipsisV,
  FaHandHoldingUsd,
  FaMoneyCheckAlt,
  FaFileInvoice,
  FaArrowCircleDown,
  FaUserEdit,
} from 'react-icons/fa';

const MobileActionDropdown = ({ onOpenModal, navigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="mobile-actions-dropdown" ref={dropdownRef}>
      <button className="dropdown-toggle" onClick={() => setIsOpen(!isOpen)}>
        <FaEllipsisV />
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          <button onClick={() => handleAction(() => navigate('/jobsheet-report'))}>
            <FaClipboardList /> Jobsheet
          </button>
          <button onClick={() => handleAction(() => onOpenModal('register'))}>
            <FaCashRegister /> Register
          </button>
          <button onClick={() => handleAction(() => navigate('/payment-against-purchase'))}>
            <FaHandHoldingUsd /> Payment Out Screen
          </button>
          <button onClick={() => handleAction(() => navigate('/payment-report?invoiceTypes=PURCHASE'))}>
            <FaMoneyCheckAlt /> Another Payment Out (Purchase)
          </button>
          <button onClick={() => handleAction(() => navigate('/payment-against-sale-return'))}>
            <FaMoneyCheckAlt /> Other Payment Out
          </button>
          <button onClick={() => handleAction(() => navigate('/payment-report'))}>
            <FaFileInvoice /> All Payment Data View
          </button>
          <button onClick={() => handleAction(() => navigate('/suppliers-list'))}>
            <FaUserEdit /> Supplier Update
          </button>
          <button onClick={() => handleAction(() => navigate('/receipt-against-sale'))}>
            <FaArrowCircleDown /> Payment In
          </button>
          <button onClick={() => handleAction(() => onOpenModal('sales'))}>
            <FaThList /> Today's Sales
          </button>
          <button onClick={() => handleAction(() => onOpenModal('held'))}>
            <FaPauseCircle /> Held Sales
          </button>
          <button onClick={() => handleAction(() => onOpenModal('recent'))}>
            <FaHistory /> Recent Sales
          </button>
          <button onClick={() => handleAction(() => navigate('/'))}>
            <FaTachometerAlt /> Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileActionDropdown;