import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import './style.scss'; // Ensure CSS is imported

const ViewButtonForReceiptAndPayment = ({
  path = "/receipt-report",
  buttonText = "View Report",
}) => {
  const navigate = useNavigate();

  return (
    <button className='ViewButtonForReceiptAndPayment'
      onClick={() => navigate(path)}
    >
      <FaEye />
      {/* Wrap text in a span for targeted CSS hiding */}
      <span className="ViewButtonForReceiptAndPayment__text">
          {buttonText}
      </span>
    </button>
  );
};

export default ViewButtonForReceiptAndPayment;