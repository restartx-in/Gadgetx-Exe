import { useState, useRef, useEffect } from 'react';
import { MdMoreVert } from 'react-icons/md';
import { FaEye, FaPencilAlt, FaTrash } from 'react-icons/fa'; 
import ViewButton from "@/components/ViewButton";
import EditButton from "@/components/EditButton";
import DeleteButtonWithModal from '@/components/Transaction/DeleteButtonWithModal'

import './style.scss';

const ThreeDotMenu = ({ onView, onEdit, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleActionClick = (action) => {
    if (action) {
      action(); 
    }
    setIsMenuOpen(false);  
  };
  
  const hasActions = onView || onEdit || onDelete;

  if (!hasActions) {
    return null; 
  }

  return (
    <div className="three-dot-menu" ref={menuRef}>
      <button
        type="button"
        className="three-dot-menu__trigger"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
      >
        <MdMoreVert />
      </button>

      {isMenuOpen && (
        <div className="three-dot-menu__menu">
          {onView && (
            <div>
            <ViewButton
             
              className="three-dot-menu__item"
              onClick={() => handleActionClick(onView)}
            >
              <span className='fs14'> view</span>
             
            </ViewButton>
            </div>
          )}
          {onEdit && (
            <div>
            <EditButton
              className="three-dot-menu__item"
              onClick={() => handleActionClick(onEdit)}
            >
           
              <span className='fs14'>Edit</span>
            </EditButton>
              </div>
          )}
          
          {onDelete && (
            <div className="three-dot-menu__item" >
            <DeleteButtonWithModal
              className="three-dot-menu__item-dlt_btn"
              onClick={() => handleActionClick(onDelete)}
            />
              <span className='fs14'>Delete</span>
              

            </div>

          )}
        </div>
      )}
    </div>
  );
};

export default ThreeDotMenu;