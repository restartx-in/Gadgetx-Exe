import React, { useState, useRef, useEffect } from 'react'
import { FaEllipsisV, FaEye, FaTrash } from 'react-icons/fa'
import VStack from '@/components/VStack'
import './style.scss' // Ensure you import your scss file here

const ThreeDotActionMenu = ({ onView, onDelete, isViewMode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // Handle clicking outside to close the menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleMenu = (e) => {
    e.stopPropagation() // Prevent row click events if any
    setIsOpen(!isOpen)
  }

  return (
    <div className="three-dot-menu" ref={menuRef}>
      {/* The 3-Dot Button */}
      <button
        type="button"
        className="three-dot-menu__trigger"
        onClick={toggleMenu}
      >
        <FaEllipsisV color="#888" size={14} />
      </button>

      {/* The Dropdown Menu */}
      {isOpen && (
        <div className="three-dot-menu__dropdown">
          <VStack gap="0px">
            {/* View Button */}
            <button
              type="button"
              className="three-dot-menu__item"
              onClick={(e) => {
                e.stopPropagation()
                onView()
                setIsOpen(false)
              }}
            >
              <FaEye color="#4a90e2" /> 
            </button>

            {/* Delete Button (Conditional) */}
            {!isViewMode && (
              <button
                type="button"
                className="three-dot-menu__item three-dot-menu__item--delete"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                  setIsOpen(false)
                }}
              >
                <FaTrash color="#e02020" size={12} /> 
              </button>
            )}
          </VStack>
        </div>
      )}
    </div>
  )
}

export default ThreeDotActionMenu