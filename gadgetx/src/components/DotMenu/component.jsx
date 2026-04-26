import React, { useState, useEffect, useRef } from 'react';
import { CgMoreVerticalAlt } from "react-icons/cg";
import './style.scss';

const DotMenu = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Toggle menu visibility
  const toggleMenu = (e) => {
    e.stopPropagation(); // Prevents click from bubbling to the document
    setIsOpen(!isOpen);
  };

  // Handle item click and close menu
  const handleItemClick = (e, onClick) => {
    e.stopPropagation();
    onClick();
    setIsOpen(false);
  };

  // Close menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="three-dot-menu-container" ref={menuRef}>
      <button type="button" className="three-dot-menu-button" onClick={toggleMenu}>
        <CgMoreVerticalAlt size={20} />
      </button>

      {isOpen && (
        <div className="three-dot-menu-dropdown">
          <ul className="three-dot-menu-list">
            {items.map((item, index) => (
              <li
                key={index}
                className="three-dot-menu-item"
                onClick={(e) => handleItemClick(e, item.onClick)}
              >
                {item.icon && <span className="item-icon">{item.icon}</span>}
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DotMenu;