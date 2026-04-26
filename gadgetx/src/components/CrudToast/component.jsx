import { useEffect } from 'react';
import { CRUDTYPE } from '@/constants/object/crud';
import './style.scss'; // <-- renamed to style.scss

export default function CrudToast({ isOpen, crudItem, crudType, onClose }) {
  const getToastInfo = () => { // renamed function
    switch (crudType) {
      case CRUDTYPE.CREATE_SUCCESS:
        return {
          message: `${crudItem} created successfully`,
          status: 'create-success',
        };

      case CRUDTYPE.CREATE_ERROR:
        return {
          message: `Failed to create ${crudItem}`,
          status: 'create-error',
        };

      case CRUDTYPE.UPDATE_SUCCESS:
        return {
          message: `${crudItem} updated successfully`,
          status: 'update-success',
        };

      case CRUDTYPE.UPDATE_ERROR:
        return {
          message: `Failed to update ${crudItem}`,
          status: 'update-error',
        };

      case CRUDTYPE.DELETE_SUCCESS:
        return {
          message: `${crudItem} deleted successfully`,
          status: 'delete-success',
        };

      case CRUDTYPE.DELETE_ERROR:
        return {
          message: `Failed to delete ${crudItem}`,
          status: 'delete-error',
        };

      default:
        return {
          message: 'Unknown operation',
          status: 'unknown',
        };
    }
  };

  const { message, status } = getToastInfo();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // main class name renamed to 'crud_toast'
    <div className={`crud_toast fs16 fw500 ${status}`}>{message}</div>
  );
}
