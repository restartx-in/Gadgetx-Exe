import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './style.scss';

import useUserById from '@/hooks/api/user/useUserById';
import useUpdateUserByAdmin from '@/hooks/api/user/useUpdateUserByAdmin'; // <-- Import new hook
import useDeleteUser from '@/hooks/api/user/useDeleteUser';

import HStack from '@/components/HStack';
import InputField from '@/components/InputField';
import Select from '@/components/Select';
import PageTitle from '@/components/PageTitle';
import { useToast } from '@/context/ToastContext';
import { CRUDTYPE } from '@/constants/object/crud';
import IconBackButton from '@/apps/user/components/IconBackButton';

// User role options
const userTypeOptions = [
  { value: 'user', label: 'Standard User' },
  { value: 'admin', label: 'Administrator' },
];

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();

  const { data: user, isLoading: isLoadingUser, isError: isUserError, error: userError } = useUserById(id);
  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUserByAdmin();
  const { mutateAsync: deleteUser, isPending: isDeleting } = useDeleteUser();

  const [formData, setFormData] = useState({
    username: '',
    user_type: 'user',
  });
  const [isEditMode, setIsEditMode] = useState(false);

  // When user data loads, populate the form
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        user_type: user.user_type || 'user',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateUser({ userId: id, userData: formData });
      showToast({ crudItem: 'User', crudType: CRUDTYPE.UPDATE_SUCCESS });
      setIsEditMode(false); // Exit edit mode on success
    } catch (err) {
      showToast({
        crudItem: 'User',
        crudType: CRUDTYPE.UPDATE_ERROR,
        message: err.response?.data?.message || 'Failed to update user.',
      });
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete user "${user?.username}"?`)) {
      try {
        await deleteUser(id);
        showToast({ crudItem: 'User', crudType: CRUDTYPE.DELETE_SUCCESS });
        navigate('/admin/users');
      } catch (err) {
        showToast({
          crudItem: 'User',
          crudType: CRUDTYPE.DELETE_ERROR,
          message: err.response?.data?.message || 'Failed to delete user.',
        });
      }
    }
  };
  
  const handleCancel = () => {
    // Reset form to original user data and exit edit mode
    if (user) {
      setFormData({ username: user.username, user_type: user.user_type });
    }
    setIsEditMode(false);
  };


  if (isLoadingUser) return <p className="loading-message">Loading user details...</p>;
  if (isUserError) return <p className="error-message">Error: {userError.message}</p>;
  if (!user) return <p className="info-message">User not found.</p>;
  
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  return (
    <div className="edit-user">
      <form className="edit-user__card" onSubmit={handleSave}>
        <div className="back_button_container">
          <IconBackButton />
          <PageTitle title={isEditMode ? 'Edit User' : 'User Details'} />
        </div>

        <div className="edit-user__header">
          <div className="edit-user__header-content">
            <h1 className="edit-user__username">{user.username}</h1>
            <span className="edit-user__role">
              {user.user_type === 'admin' ? 'Administrator' : 'User'}
            </span>
            <p className="edit-user__member-since">
              Member Since: {formatDate(user.created_at)}
            </p>
          </div>
        </div>

        {/* Form fields are now directly inside the component */}
        <div className="edit-user__body">
          <h2 className="edit-user__section-title">User Information</h2>
          <div className="edit-user__form-fields">
            <InputField
              label="Username"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={!isEditMode || isUpdating}
              required
            />
            <Select
              label="User Role"
              id="user_type"
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              options={userTypeOptions}
              disabled={!isEditMode || isUpdating}
            />
          </div>
        </div>

        <div className="edit-user__footer">
          {isEditMode ? (
            <HStack>
              <button type="button" className="btns btns--secondary" onClick={handleCancel} disabled={isUpdating}>
                Cancel
              </button>
              <button type="submit" className="btns btns--primary" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </HStack>
          ) : (
            <HStack>
              <button type="button" className="btns btns--primary" onClick={() => setIsEditMode(true)}>
                Edit
              </button>
              <button type="button" className="btns btns--danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete User'}
              </button>
            </HStack>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditUser;