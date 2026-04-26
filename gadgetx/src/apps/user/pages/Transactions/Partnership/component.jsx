import { useState } from 'react';
import Button from '@/components/Button';
import PartnershipModal from '@/components/PartnershipModal';

const Partnership = ({ onSuccess, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSuccess = () => {
    // First, close the modal
    handleClose();
    // Then, call the onSuccess callback provided by the parent (e.g., refetch)
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
      <Button onClick={handleOpen} className={className}>
        Add Partnership
      </Button>

      <PartnershipModal
        isOpen={isOpen}
        onClose={handleClose}
        mode="add" 
        onSuccess={handleSuccess}
        // selectedPartnership is null because we are creating a new one
        selectedPartnership={null} 
      />
    </>
  );
};

export default Partnership;