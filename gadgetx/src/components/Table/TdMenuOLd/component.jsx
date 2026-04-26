import React, { useState, useRef, useEffect } from 'react'
import './style.css' // styles defined below
import ViewButton from '@/components/ViewButton'
import EditButton from '@/components/EditButton'
import DeleteButtonWithModal from '@/components/Transaction/DeleteButtonWithModal'
import HStack from '@/components/HStack'
import { MdMoreVert } from 'react-icons/md'

const TdMenuOLd = ({ onEdit, onView, onDelete }) => {
  const [open, setOpen] = useState(false)
  const popoverRef = useRef(null)
  const triggerRef = useRef(null)

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        !triggerRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <td>
      <div className="popover-container">
        <div
          ref={triggerRef}
          onClick={() => setOpen(!open)}
          className="popover-trigger"
        >
          <MdMoreVert size={24} />
        </div>

        {open && (
          <div ref={popoverRef} className="popover-content">
            <div className="popover-arrow" />
            <HStack>
              <ViewButton onClick={() => onEdit()}>Edit</ViewButton>
              <EditButton onClick={() => onView()}>View</EditButton>
              <DeleteButtonWithModal onDelete={() => onDelete()}>
                Delete
              </DeleteButtonWithModal>
            </HStack>
          </div>
        )}
      </div>
    </td>
  )
}

export default TdMenuOLd
