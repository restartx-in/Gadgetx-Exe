import React from "react";
import useCreateUser from "@/apps/user/hooks/api/user/useCreateUser";
import useUpdateUserByAdmin from "@/apps/user/hooks/api/user/useUpdateUserByAdmin";
import useDeleteUser from "@/apps/user/hooks/api/user/useDeleteUser";
import RoleAutoCompleteWithAddOption from "@/apps/user/components/RoleAutoCompleteWithAddOption";
import CommonUserModal from "@/pages/CommonUserModal"; 

const AddUser = ({ isOpen, onClose, mode, selectedUser, onSuccess }) => {
  return (
    <CommonUserModal
      // App-specific hooks
      useCreateHook={useCreateUser} 
      useUpdateHook={useUpdateUserByAdmin}
      useDeleteHook={useDeleteUser}
      
      // App-specific components
      RoleSelectorComponent={RoleAutoCompleteWithAddOption}
      
      // Modal Props
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      selectedUser={selectedUser} 
      onSuccess={onSuccess}
    />
  );
};

export default AddUser;