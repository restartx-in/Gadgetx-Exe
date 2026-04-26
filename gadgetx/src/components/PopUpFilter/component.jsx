import React from 'react'
import { Modal, ModalHeader, ModalFooter, ModalBody } from '@/components/Modal'
import CancelButton from '@/apps/user/components/CancelButton'
import SubmitButton from '@/apps/user/components/SubmitButton'
import FilterButton from '@/components/FilterButton'
import { CiFilter } from "react-icons/ci";

const PopUpFilter = ({
  isOpen,
  setIsOpen,
  onApply,
  children,
  isLoading,
  size = 'md',
}) => {
  // The 'onClose' function is passed to the Modal, which handles
  // closing via Escape key, overlay click, or its own close button.
  const handleClose = () => {
    setIsOpen(false)
  }

  // The 'handleApply' function now also closes the modal after applying filters.
  const handleApply = () => {
    if (onApply) {
      onApply()
    }
    handleClose()
  }

  return (
    <>
      <FilterButton onClick={() => setIsOpen(true)}>
        <CiFilter   size={18} />
        </FilterButton>

      <Modal isOpen={isOpen} onClose={handleClose} size={size}>
        <div className='filter fs24 fw400'>
          <ModalHeader onClose={handleClose}>Filter</ModalHeader>
        </div>
        <ModalBody>{children}</ModalBody>
        <ModalFooter
          style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}
        >
          <CancelButton onClick={handleClose} />
          <button onClick={handleApply} className="submit_button2">
            {isLoading ? (
              <span className="submit_button2-loader"></span>
            ) : (
              <span className="submit_button2-text fs18 fw500 ">Apply</span>
            )}
          </button>{' '}
        </ModalFooter>
      </Modal>
    </>
  )
}

export default PopUpFilter
