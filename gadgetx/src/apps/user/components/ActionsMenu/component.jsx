import React, { useState, useRef, useEffect } from "react";
import { MdMoreVert } from "react-icons/md";
import EditButton from "@/components/EditButton";
import ViewButton from "@/components/ViewButton";
import DeleteButtonForActionMenu from "./components/DeleteButtonForActionMenu";
import "./style.scss";

const ActionsMenu = ({ onView, onEdit, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const deleteActionRef = useRef(null); // Ref for the delete component

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const handleActionClick = (action) => {
    if (action) {
      action();
    }
    setIsMenuOpen(false);
  };

  const hasActions = onView || onEdit || onDelete;
  if (!hasActions) return null;

  // Function to trigger the delete modal
  const handleDeleteTrigger = () => {
    if (deleteActionRef.current) {
      deleteActionRef.current.openModal(); // Call the exposed openModal method
    }
  };

  return (
    <div className="actions-menu" ref={menuRef}>
      <button
        type="button"
        className="actions-menu__trigger"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
      >
        <MdMoreVert />
      </button>

      {isMenuOpen && (
        <div className="actions-menu__menu">
          {onView && (
            <div
              className="actions-menu__item"
              onClick={() => handleActionClick(onView)}
              onKeyDown={(e) => e.key === "Enter" && handleActionClick(onView)}
              role="button"
              tabIndex={0}
            >
              <ViewButton />
              <span>View</span>
            </div>
          )}
          {onEdit && (
            <div
              className="actions-menu__item"
              onClick={() => handleActionClick(onEdit)}
              onKeyDown={(e) => e.key === "Enter" && handleActionClick(onEdit)}
              role="button"
              tabIndex={0}
            >
              <EditButton />
              <span>Edit</span>
            </div>
          )}
          {onDelete && (
            <div
              className="actions-menu__item"
              onClick={handleDeleteTrigger}
              onKeyDown={(e) => e.key === "Enter" && handleDeleteTrigger()}
              role="button"
              tabIndex={0}
            >
              <DeleteButtonForActionMenu
                ref={deleteActionRef} // Attach the ref
                onClick={() => handleActionClick(onDelete)} // Pass the final delete action
              >
                Delete
              </DeleteButtonForActionMenu>
              <span>Delete</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionsMenu;
