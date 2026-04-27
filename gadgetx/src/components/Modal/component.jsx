import React, { useEffect, useContext, createContext } from 'react';
import ReactDOM from 'react-dom';
import { IoClose } from 'react-icons/io5';

import './style.scss'
export const ModalHeader = ({ children, onClose }) => (
  <div className="modal_header">
    {children}
    <button
      className="modal_header-btn"
      onClick={onClose}
      aria-label="Close modal">
      <IoClose color="var(--navy)" size={25} />
    </button>
  </div>
)

export const ModalBody = ({
  children,
  overflowY = 'auto',
  maxHeight = '350px',
}) => {
  return (
    <div className="modal_body" style={{ maxHeight, overflowY }}>
      {children}
    </div>
  )
}

export const ModalFooter = ({ children, style }) => (
  <div className="modal_footer" style={style}>
    {children}
  </div>
);

export function Modal({ isOpen, onClose, children, size = 'lg' }) {
  const modalWidth = {
    xs: '320px',
    sm: '384px',
    md: '448px',
    lg: '512px',
    xl: '576px',
    '2xl': '672px',
    '5xl': '1072px',
  }

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title">
      <div
        className="modal-content"
        style={{ maxWidth: modalWidth[size] }}
        onClick={(e) => e.stopPropagation()}>
        {React.Children.map(children, (child) => {
          if (child.type === ModalHeader) {
            return React.cloneElement(child, { onClose })
          }
          return child
        })}
      </div>
    </div>
  )
}

