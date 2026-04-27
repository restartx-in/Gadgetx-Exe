import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AddButton from "@/components/AddButton";
import PartnershipModal from "@/apps/user/components/PartnershipModal";

const Partnership = ({ onSuccess, className }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // CORRECTED PATH: Listen for 'add' to match your sidebar's addPath
    if (searchParams.get("action") === "add" && !isOpen) {
      setIsOpen(true);
    }
  }, [searchParams, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    // CORRECTED PATH: Set the action to 'add'
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("action", "add");
    setSearchParams(newSearchParams, { replace: true });
  };

  const handleClose = () => {
    setIsOpen(false);
    // CORRECTED PATH: Clean up the 'add' action
    const newSearchParams = new URLSearchParams(searchParams);
    if (newSearchParams.has("action")) {
      newSearchParams.delete("action");
      setSearchParams(newSearchParams, { replace: true });
    }
  };

  const handleSuccess = () => {
    handleClose();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
      <AddButton onClick={handleOpen} className={className}>
        Add 
      </AddButton>

      <PartnershipModal
        isOpen={isOpen}
        onClose={handleClose}
        mode="add"
        onSuccess={handleSuccess}
        selectedPartnership={null}
      />
    </>
  );
};

export default Partnership;