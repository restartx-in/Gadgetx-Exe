import React, { useState } from 'react'  
import { IoAdd } from "react-icons/io5";
import { FiTrash2 } from "react-icons/fi";
import { LuEye } from "react-icons/lu";
import { CiEdit } from "react-icons/ci";
import { FiArrowLeft } from "react-icons/fi";
import './style.scss'

const Button = ({
  children,
  onClick,
  type = 'button', 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
  ...props
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const buttonClasses = `button ${variant} ${size} fw500 ${className}`.trim()

  const handleButtonClick = (e) => {
    if (variant === 'delete') {
      setIsModalOpen(true);
    } else if (onClick) {
      onClick(e);
    }
  };

  const handleConfirmDelete = () => {
    if (onClick) {
      onClick();
    }
    setIsModalOpen(false);
  };

  let buttonContent = children

  if (variant === 'delete') {
    buttonContent = (
      <>
        <span className="button-icon">
          <FiTrash2 className="w-5 h-5" />
        </span>
        <span className="button-text">{children}</span>
      </>
    )
  } else if (variant === 'edit') {
    buttonContent = (
      <>
        <span className="button-icon">
          <CiEdit className="w-5 h-5" />
        </span>
        <span className="button-text">{children}</span>
      </>
    )
  } else if (variant === 'view') {
    buttonContent = (
      <>
        <span className="button-icon">
          <LuEye className="w-5 h-5" />
        </span>
        <span className="button-text">{children}</span>
      </>
    )
  } else if (variant === 'add') {
    buttonContent = (
      <>
        <span className="button-icon">
          <IoAdd className="w-5 h-5" />
        </span>
        <span className="button-text">{children}</span>
      </>
    )
  } else if (variant === 'back') {
    buttonContent = (
      <>
        <span className="button-icon">
          <FiArrowLeft className="w-5 h-5" />
        </span>
        <span className="button-text">{children}</span>
      </>
    )
  }

  return (
    <>
      <button
        className={buttonClasses}
        onClick={handleButtonClick}
        type={type}
        disabled={disabled}
        {...props}
      >
        {buttonContent}
      </button>

      {isModalOpen && variant === 'delete' && (
        <div className="button_modal_overlay">
          <div className="button_modal_overlay__modal">
            <h3>Are you sure you want to delete?</h3>
            <div className="button_modal_overlay__modal-actions">
              <button
                className="button secondary medium"
                onClick={() => setIsModalOpen(false)}
              >
                No
              </button>
              <button
                className="button danger medium"
                onClick={handleConfirmDelete}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Button

